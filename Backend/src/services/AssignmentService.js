const Staff = require("../models/Staff");
const AssignmentMeta = require("../models/AssignmentMeta");
const { Types } = require("mongoose");

class AssignmentService {
    /**
     * Calculates the SLA deadline based on issue priority
     * @param {String} priority - low, medium, or high
     * @returns {Date}
     */
    static calculateSLADeadline(priority) {
        const now = new Date();
        switch (priority) {
            case "high":
                return new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
            case "medium":
                return new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours
            case "low":
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
        }
    }

    /**
     * Finds and assigns the next available staff member using round-robin logic
     * @param {Object} issue - The issue document
     * @param {Array} excludeStaffIds - IDs to skip (used in reassignment)
     * @returns {Object|null} The assigned Staff member or null if none available
     */
    static async assignToStaff(issue, excludeStaffIds = []) {
        try {
            const department = issue.department || issue.category;

            // 1. Find all available resolving staff in the department
            const availableStaff = await Staff.find({
                department: department,
                role: "resolving_staff",
                status: "approved",
                availabilityStatus: "available",
                _id: { $nin: excludeStaffIds }
            }).sort({ currentActiveIssues: 1, _id: 1 });

            if (availableStaff.length === 0) {
                console.log(`[AssignmentService] No available staff found for department: ${department}`);
                return null;
            }

            // 2. Get round-robin state
            let meta = await AssignmentMeta.findOne({ department });
            if (!meta) {
                meta = new AssignmentMeta({ department });
            }

            // 3. Select the next staff in rotation
            let staffToAssign = null;
            if (!meta.lastAssignedStaffId) {
                // First assignment for this department
                staffToAssign = availableStaff[0];
            } else {
                // Find index of last assigned
                const lastIndex = availableStaff.findIndex(s => s._id.toString() === meta.lastAssignedStaffId.toString());
                // Next index (circular)
                const nextIndex = (lastIndex + 1) % availableStaff.length;
                staffToAssign = availableStaff[nextIndex];
            }

            // 4. Update Staff and AssignmentMeta (Atomic-ish)
            staffToAssign.currentActiveIssues += 1;
            await staffToAssign.save();

            meta.lastAssignedStaffId = staffToAssign._id;
            await meta.save();

            // 5. Update Issue
            issue.assignedTo = staffToAssign._id;
            issue.assignedAt = new Date();
            issue.slaDeadline = this.calculateSLADeadline(issue.priority);
            issue.status = "pending"; // Ensure it's pending until acknowledged

            await issue.save();

            console.log(`[AssignmentService] Issue ${issue._id} assigned to ${staffToAssign.name} (${staffToAssign.email})`);
            return staffToAssign;
        } catch (error) {
            console.error("[AssignmentService] Assignment failed:", error.message);
            return null;
        }
    }
}

module.exports = AssignmentService;
