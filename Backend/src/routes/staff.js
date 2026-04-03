const router = require("express").Router();
const Staff = require("../models/Staff");
const Issue = require("../models/Issue");
const authMiddleware = require("../middleware/authMiddleware");
const dbUserMiddleware = require("../middleware/dbUserMiddleware");

/**
 * @route   PATCH /api/staff/status
 * @desc    Toggle staff availability status
 * @access  Protected (Resolving Staff only)
 */
router.patch("/status", authMiddleware, dbUserMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["available", "busy", "on_break", "offline"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const staff = await Staff.findByIdAndUpdate(
            req.dbUser._id,
            { availabilityStatus: status },
            { new: true }
        );

        return res.json({ success: true, status: staff.availabilityStatus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/staff/acknowledge/:issueId
 * @desc    Staff acknowledges an issue (High Priority requirement)
 * @access  Protected (Assignee only)
 */
router.post("/acknowledge/:issueId", authMiddleware, dbUserMiddleware, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.issueId);
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        if (issue.assignedTo.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({ success: false, message: "Only assignee can acknowledge" });
        }

        issue.acknowledgedAt = new Date();
        issue.status = "in_progress";
        await issue.save();
        console.log(`[StaffRoute] Issue ${issue._id} acknowledged. Status set to: ${issue.status}`);

        return res.json({ success: true, issue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/staff/resolve/:issueId
 * @desc    Staff resolves an issue
 * @access  Protected (Assignee only)
 */
router.post("/resolve/:issueId", authMiddleware, dbUserMiddleware, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.issueId);
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        if (issue.assignedTo.toString() !== req.dbUser._id.toString()) {
            return res.status(403).json({ success: false, message: "Only assignee can resolve" });
        }

        issue.status = "resolved";
        issue.resolvedAt = new Date();
        await issue.save();

        // Decrement active issues count for staff
        await Staff.findByIdAndUpdate(req.dbUser._id, { $inc: { currentActiveIssues: -1 } });

        return res.json({ success: true, issue });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/staff
 * @desc    Get all approved resolving staff (optionally filtered by department)
 * @access  Protected (Admin only)
 */
async function requireAdmin(req, res, next) {
    const User = require("../models/User");
    const admin = await User.findOne({ firebaseUid: req.user.uid, role: "admin" });
    if (!admin) return res.status(403).json({ success: false, message: "Admin only" });
    next();
}

router.get("/", authMiddleware, dbUserMiddleware, requireAdmin, async (req, res) => {
    try {
        const { department } = req.query;
        const query = { role: "resolving_staff", status: "approved" };
        if (department) {
            query.department = department;
        }

        const staff = await Staff.find(query).sort({ name: 1 });
        return res.json({
            success: true,
            staff: staff.map(s => ({
                _id: s._id,
                name: s.name,
                email: s.email,
                department: s.department,
                availabilityStatus: s.availabilityStatus,
                currentActiveIssues: s.currentActiveIssues
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
