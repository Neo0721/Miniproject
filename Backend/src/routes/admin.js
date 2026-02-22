const router = require("express").Router();
const Staff = require("../models/Staff");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * Middleware: verify that the logged-in user is an admin
 * (must come after authMiddleware, which populates req.user)
 */
async function requireAdmin(req, res, next) {
    try {
        const firebaseUid = req.user?.uid;
        if (!firebaseUid) {
            return res.status(401).json({ success: false, message: "Unauthorized", error: "UNAUTHORIZED" });
        }

        // Admins live in the User collection
        const admin = await User.findOne({ firebaseUid, role: "admin" });
        if (!admin) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only.",
                error: "FORBIDDEN"
            });
        }

        req.admin = admin;
        next();
    } catch (err) {
        console.error("Admin check error:", err);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
}

/**
 * @route   GET /api/admin/pending-staff
 * @desc    Get all staff accounts with status "pending"
 * @access  Admin only
 */
router.get("/pending-staff", authMiddleware, requireAdmin, async (req, res) => {
    try {
        const pendingStaff = await Staff.find({ status: "pending" }).sort({ createdAt: -1 });

        return res.json({
            success: true,
            staff: pendingStaff.map(s => ({
                _id: s._id,
                name: s.name,
                email: s.email,
                department: s.department,
                teacherId: s.teacherId,
                role: s.role,
                status: s.status,
                createdAt: s.createdAt
            }))
        });
    } catch (error) {
        console.error("Fetch pending staff error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching pending staff",
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/admin/approve-staff/:id
 * @desc    Approve a pending teacher → become resolving_staff
 * @access  Admin only
 */
router.patch("/approve-staff/:id", authMiddleware, requireAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        const updateRole = ["teacher", "resolving_staff"].includes(role) ? role : "resolving_staff";

        const staff = await Staff.findByIdAndUpdate(
            req.params.id,
            { role: updateRole, status: "approved" },
            { new: true }
        );

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found",
                error: "NOT_FOUND"
            });
        }

        console.log(`✅ Staff approved as resolving_staff: ${staff.email}`);

        return res.json({
            success: true,
            message: `${staff.name} approved as resolving staff`,
            staff: {
                _id: staff._id,
                name: staff.name,
                email: staff.email,
                role: staff.role,
                status: staff.status,
                department: staff.department
            }
        });
    } catch (error) {
        console.error("Approve staff error:", error);
        return res.status(500).json({
            success: false,
            message: "Error approving staff",
            error: error.message
        });
    }
});

/**
 * @route   GET /api/admin/resolving-staff
 * @desc    Get all approved resolving staff (for issue assignment dropdowns)
 * @access  Admin only
 */
router.get("/resolving-staff", authMiddleware, requireAdmin, async (req, res) => {
    try {
        const staff = await Staff.find({
            role: "resolving_staff",
            status: "approved"
        }).sort({ name: 1 });

        return res.json({
            success: true,
            staff: staff.map(s => ({
                _id: s._id,
                name: s.name,
                email: s.email,
                department: s.department
            }))
        });
    } catch (error) {
        console.error("Fetch resolving staff error:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching resolving staff",
            error: error.message
        });
    }
});

module.exports = router;
