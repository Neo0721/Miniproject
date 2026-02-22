const axios = require("axios");
const Staff = require("../models/Staff");
const User = require("../models/User");

class NotificationService {
    /**
     * Triggers a notification via n8n webhook when a new issue is created
     * @param {Object} issue - The created issue object (should be populated with assignedTo)
     */
    static async triggerNewIssueAlert(issue) {
        try {
            const targetDept = issue.department || issue.category;
            console.log(`[NotificationService] Processing alert for issue: ${issue.title} (Dept: ${targetDept}, Priority: ${issue.priority})`);

            // 1. Fetch staff members
            // If assignedTo is present, only notify them. Otherwise (fallback), notify all dept staff.
            let targetStaff = [];
            if (issue.assignedTo) {
                const assigned = await Staff.findById(issue.assignedTo);
                if (assigned) targetStaff = [assigned];
            }

            if (targetStaff.length === 0) {
                // Fallback: This shouldn't normally happen with auto-assignment, but safe to have.
                const [staffFromStaffModel, staffFromUserModel] = await Promise.all([
                    Staff.find({
                        department: targetDept,
                        role: "resolving_staff",
                        status: "approved"
                    }),
                    User.find({
                        role: "staff",
                        department: targetDept
                    })
                ]);
                targetStaff = [...staffFromStaffModel, ...staffFromUserModel];
            }

            // Merge and remove duplicates by email
            const uniqueStaff = Array.from(new Map(targetStaff.map(s => [s.email, s])).values());

            if (uniqueStaff.length === 0) {
                console.warn(`[NotificationService] No target staff found for issue: ${issue._id}.`);
                return;
            }

            // 2. Extract dynamic contacts
            const emails = uniqueStaff.map(s => s.email).filter(e => !!e).join(",");
            const phones = uniqueStaff.map(s => s.phone).filter(p => !!p).join(",");

            // 3. Ensure Reporter info is available
            let reporterName = "Anonymous";
            if (issue.reportedBy) {
                if (typeof issue.reportedBy === 'object' && issue.reportedBy.name) {
                    reporterName = issue.reportedBy.name;
                } else {
                    const [user, staff] = await Promise.all([
                        User.findById(issue.reportedBy).select("name"),
                        Staff.findById(issue.reportedBy).select("name")
                    ]);
                    if (user) reporterName = user.name;
                    else if (staff) reporterName = staff.name;
                }
            }

            // 4. Prepare payload for n8n
            const payload = {
                type: "NEW_ASSIGNMENT",
                title: issue.title,
                description: issue.description,
                priority: issue.priority,
                reporter: reporterName,
                department: targetDept,
                emails,
                phones,
                id: issue._id,
                createdAt: issue.createdAt,
                slaDeadline: issue.slaDeadline
            };

            await this.sendToN8n(payload);
        } catch (error) {
            console.error("[NotificationService] Failed to trigger n8n notification:", error.message);
        }
    }

    /**
     * Triggers a notification when an issue is escalated
     * @param {Object} issue - The escalated issue object
     */
    static async triggerEscalationAlert(issue) {
        try {
            const targetDept = issue.department || issue.category;
            console.log(`[NotificationService] ESCALATING issue: ${issue.title} (Dept: ${targetDept})`);

            // Notify all staff in department + Admins
            const [deptStaff, admins] = await Promise.all([
                Staff.find({ department: targetDept, status: "approved" }),
                User.find({ role: "admin" })
            ]);

            const allTargets = [...deptStaff, ...admins];
            const uniqueStaff = Array.from(new Map(allTargets.map(s => [s.email, s])).values());

            const emails = uniqueStaff.map(s => s.email).filter(e => !!e).join(",");

            const payload = {
                type: "ESCALATION",
                title: `[ESCALATED] ${issue.title}`,
                description: `SLA breached after max reassignments: ${issue.description}`,
                priority: "critical", // Overriding to critical for escalation
                reporter: "SYSTEM",
                department: targetDept,
                emails,
                id: issue._id,
                reassignmentCount: issue.reassignmentCount
            };

            await this.sendToN8n(payload);
        } catch (error) {
            console.error("[NotificationService] Failed to trigger escalation notification:", error.message);
        }
    }

    /**
     * Helper to send payload to n8n
     */
    static async sendToN8n(payload) {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("[NotificationService] N8N_WEBHOOK_URL missing.");
            return;
        }

        console.log(`[NotificationService] Sending ${payload.type} payload to n8n`);
        await axios.post(webhookUrl, payload);
    }
}

module.exports = NotificationService;
