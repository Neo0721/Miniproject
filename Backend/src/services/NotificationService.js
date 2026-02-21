const axios = require("axios");
const Staff = require("../models/Staff");
const User = require("../models/User");

class NotificationService {
    /**
     * Triggers a notification via n8n webhook when a new issue is created
     * @param {Object} issue - The created issue object
     */
    static async triggerNewIssueAlert(issue) {
        try {
            const targetDept = issue.department || issue.category;
            console.log(`[NotificationService] Processing alert for issue: ${issue.title} (Dept: ${targetDept}, Priority: ${issue.priority})`);

            // 1. Fetch staff members from BOTH Staff and User (with role 'staff') collections
            // This ensures we don't miss anyone if the data is split
            const [staffFromStaffModel, staffFromUserModel] = await Promise.all([
                Staff.find({ department: targetDept }),
                User.find({ role: "staff", department: targetDept })
            ]);

            // Merge and remove duplicates by email
            const allStaff = [...staffFromStaffModel, ...staffFromUserModel];
            const uniqueStaff = Array.from(new Map(allStaff.map(s => [s.email, s])).values());

            if (uniqueStaff.length === 0) {
                console.warn(`[NotificationService] No staff found for department: ${targetDept}. Skipping notification.`);
                return;
            }

            // 2. Extract dynamic contacts
            const emails = uniqueStaff.map(s => s.email).filter(e => !!e).join(",");
            const phones = uniqueStaff.map(s => s.phone).filter(p => !!p).join(",");

            if (!emails && !phones) {
                console.warn(`[NotificationService] Staff found but no valid emails or phones for department: ${targetDept}`);
                return;
            }

            // 3. Ensure Reporter info is available
            let reporterName = "Anonymous";
            if (issue.reportedBy) {
                if (typeof issue.reportedBy === 'object' && issue.reportedBy.name) {
                    reporterName = issue.reportedBy.name;
                } else {
                    // It's likely just an ID, try to fetch the user
                    const user = await User.findById(issue.reportedBy).select("name");
                    if (user) reporterName = user.name;
                }
            }

            // 4. Prepare payload for n8n
            const payload = {
                title: issue.title,
                description: issue.description,
                priority: issue.priority,
                reporter: reporterName,
                department: targetDept,
                emails,
                phones,
                id: issue._id,
                createdAt: issue.createdAt
            };

            // 5. Send to n8n Webhook
            const webhookUrl = process.env.N8N_WEBHOOK_URL;

            if (!webhookUrl) {
                console.error("[NotificationService] N8N_WEBHOOK_URL is not defined in environment variables.");
                return;
            }

            console.log(`[NotificationService] Sending payload to n8n with priority: ${payload.priority}`);
            await axios.post(webhookUrl, payload);

            console.log(`[NotificationService] Alert sent successfully to n8n for ${uniqueStaff.length} staff members.`);
        } catch (error) {
            console.error("[NotificationService] Failed to trigger n8n notification:", error.message);
        }
    }
}

module.exports = NotificationService;
