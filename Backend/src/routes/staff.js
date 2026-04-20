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

        // SLA Credit Logic for Acknowledgement (Time to Start)
        let creditChange = 0;
        let creditReason = "Standard response time";
        
        const startTime = issue.assignedAt || issue.createdAt;
        if (startTime) {
            const durationMs = issue.acknowledgedAt.getTime() - new Date(startTime).getTime();
            const minutesToAck = durationMs / (1000 * 60);

            const priority = issue.priority || "medium";

            if (priority === "high") {
                if (minutesToAck <= 5) {
                    creditChange = 5;
                    creditReason = "Fast high-priority start (+5 credits)";
                } else {
                    creditChange = -5;
                    creditReason = "Delayed high-priority start (-5 credits)";
                }
            } else {
                if (minutesToAck <= 5) {
                    creditChange = 3;
                    creditReason = "Fast start (+3 credits)";
                } else if (minutesToAck <= 10) {
                    creditChange = 1;
                    creditReason = "Standard start (+1 credit)";
                } else {
                    creditChange = -2;
                    creditReason = "Delayed start (-2 credits)";
                }
            }
        }

        if (creditChange !== 0) {
            await Staff.findByIdAndUpdate(req.dbUser._id, { $inc: { credits: creditChange } });
        }

        return res.json({ success: true, issue, creditChange, creditReason });
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

        // SLA Credit Logic for Resolution
        let creditChange = 0;
        let creditReason = "Issue resolved outside ideal timeframe";

        const startTime = issue.acknowledgedAt || issue.assignedAt || issue.createdAt;
        if (startTime) {
            const durationMs = issue.resolvedAt.getTime() - new Date(startTime).getTime();
            const priority = issue.priority || "medium";
            const minutesToResolve = durationMs / (1000 * 60);

            if (priority === "high") {
                if (minutesToResolve <= 30) {
                    creditChange = 10;
                    creditReason = "Fast high-priority resolution (+10 credits)";
                } else {
                    creditChange = -5;
                    creditReason = "Delayed high-priority resolution (-5 credits)";
                }
            } else {
                if (minutesToResolve <= 30) {
                    creditChange = 5;
                    creditReason = "Fast resolution (+5 credits)";
                } else if (minutesToResolve <= 60) {
                    creditChange = 2;
                    creditReason = "Standard resolution (+2 credits)";
                } else {
                    creditChange = -3;
                    creditReason = "Delayed resolution (-3 credits)";
                }
            }
        }

        // Decrement active issues count for staff and add credits
        await Staff.findByIdAndUpdate(req.dbUser._id, { 
            $inc: { currentActiveIssues: -1, credits: creditChange } 
        });

        return res.json({ success: true, issue, creditChange, creditReason });
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
                currentActiveIssues: s.currentActiveIssues,
                credits: s.credits || 0
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
