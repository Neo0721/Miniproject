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
            const department = (issue.department || issue.category || "").trim();
            console.log(`[AssignmentService] Attempting assignment for issue: "${issue.title}" (Dept: "${department}")`);

            // Case-insensitive department match
            const deptRegex = new RegExp(`^${department.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

            // 1. Find all available resolving staff in the department
            let availableStaff = await Staff.find({
                department: { $regex: deptRegex },
                role: "resolving_staff",
                status: "approved",
                availabilityStatus: "available",
                _id: { $nin: excludeStaffIds }
            }).sort({ currentActiveIssues: 1, _id: 1 });

            console.log(`[AssignmentService] Query 1 (available) found: ${availableStaff.length}`);

            // Fallback: if no 'available' staff, pick any non-offline approved resolving_staff
            if (availableStaff.length === 0) {
                console.log(`[AssignmentService] Trying fallback (any non-offline) for department: "${department}"`);
                availableStaff = await Staff.find({
                    department: { $regex: deptRegex },
                    role: "resolving_staff",
                    status: "approved",
                    availabilityStatus: { $ne: "offline" },
                    _id: { $nin: excludeStaffIds }
                }).sort({ currentActiveIssues: 1, _id: 1 });
                console.log(`[AssignmentService] Query 2 (non-offline) found: ${availableStaff.length}`);
            }

            // Last resort: any approved resolving_staff in department regardless of availability
            if (availableStaff.length === 0) {
                console.log(`[AssignmentService] Trying last resort (any approved) for department: "${department}"`);
                availableStaff = await Staff.find({
                    department: { $regex: deptRegex },
                    role: "resolving_staff",
                    status: "approved",
                    _id: { $nin: excludeStaffIds }
                }).sort({ currentActiveIssues: 1, _id: 1 });
                console.log(`[AssignmentService] Query 3 (any approved) found: ${availableStaff.length}`);
            }

            if (availableStaff.length === 0) {
                console.warn(`[AssignmentService] CRITICAL: No staff found at all for department: "${department}"`);
                
                // DIAGNOSTIC LOGGING: Let's see what's actually in the DB
                const totalStaffCount = await Staff.countDocuments({});
                const allStaff = await Staff.find({}).limit(5);
                console.log(`[AssignmentService] DB Diagnostic - Total Staff Count: ${totalStaffCount}`);
                allStaff.forEach(s => {
                    console.log(`[AssignmentService] - Staff Name: "${s.name}", Email: "${s.email}", Role: "${s.role}", Status: "${s.status}", Department: "${s.department}"`);
                });

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
