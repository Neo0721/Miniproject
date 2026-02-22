const Issue = require("../models/Issue");
const Staff = require("../models/Staff");
const AssignmentService = require("./AssignmentService");
const NotificationService = require("./NotificationService");

class MonitoringService {
    /**
     * Starts the monitoring background job
     * @param {Number} intervalMs - Frequency of checks in milliseconds (default 1 min)
     */
    static start(intervalMs = 60000) {
        console.log(`[MonitoringService] Background monitor started (Interval: ${intervalMs}ms)`);
        setInterval(() => this.checkAllPolicies(), intervalMs);
    }

    static async checkAllPolicies() {
        try {
            const now = new Date();
            console.log(`[MonitoringService] Running check at: ${now.toISOString()}`);

            // 1. Check for High Priority Acknowledgement Timeout (5 mins)
            await this.handleAcknowledgementTimeouts(now);

            // 2. Check for SLA Breaches
            await this.handleSLABreaches(now);

        } catch (error) {
            console.error("[MonitoringService] Loop error:", error.message);
        }
    }

    /**
     * Reassigns high-priority issues if not acknowledged within 5 minutes
     */
    static async handleAcknowledgementTimeouts(now) {
        const timeoutThreshold = new Date(now.getTime() - 5 * 60 * 1000);

        // Issues that are NOT acknowledged (acknowledgedAt is null) 
        // AND are high priority 
        // AND were assigned more than 5 minutes ago
        const stalledIssues = await Issue.find({
            priority: "high",
            status: "pending",
            acknowledgedAt: { $exists: false },
            assignedAt: { $lt: timeoutThreshold },
            reassignmentCount: { $lt: 2 }
        });

        for (const issue of stalledIssues) {
            console.log(`[MonitoringService] High-priority issue ${issue._id} timed out. Reassigning...`);
            await this.reassignIssue(issue);
        }
    }

    /**
     * Escalates or reassigns issues that exceeded their SLA deadline
     */
    static async handleSLABreaches(now) {
        const breachedIssues = await Issue.find({
            status: { $in: ["pending", "in_progress"] },
            slaDeadline: { $lt: now }
        });

        for (const issue of breachedIssues) {
            if (issue.reassignmentCount < 2) {
                console.log(`[MonitoringService] Issue ${issue._id} breached SLA. Reassigning...`);
                await this.reassignIssue(issue);
            } else {
                console.log(`[MonitoringService] Issue ${issue._id} reached max reassignments. Escalating...`);
                await this.escalateIssue(issue);
            }
        }
    }

    /**
     * Core logic for reassigning an issue to a new staff member
     */
    static async reassignIssue(issue) {
        try {
            const oldAssigneeId = issue.assignedTo;

            // Decrement active count for old assignee
            if (oldAssigneeId) {
                await Staff.findByIdAndUpdate(oldAssigneeId, { $inc: { currentActiveIssues: -1 } });
            }

            // Find new staff excluding the old one
            const newStaff = await AssignmentService.assignToStaff(issue, [oldAssigneeId]);

            if (newStaff) {
                issue.reassignmentCount += 1;
                await issue.save();

                // Notify the new assignee
                NotificationService.triggerNewIssueAlert(issue);
            } else {
                // If no other staff found, escalate immediately
                await this.escalateIssue(issue);
            }
        } catch (error) {
            console.error(`[MonitoringService] Reassignment failed for ${issue._id}:`, error.message);
        }
    }

    /**
     * Escalates an issue to admin/department
     */
    static async escalateIssue(issue) {
        try {
            issue.status = "escalated";
            issue.escalated = true;
            issue.escalatedAt = new Date();
            await issue.save();

            // Notify everyone in department + admin
            NotificationService.triggerEscalationAlert(issue);
        } catch (error) {
            console.error(`[MonitoringService] Escalation failed for ${issue._id}:`, error.message);
        }
    }
}

module.exports = MonitoringService;
