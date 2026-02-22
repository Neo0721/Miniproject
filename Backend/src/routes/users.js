const router = require("express").Router();
const User = require("../models/User");
const Staff = require("../models/Staff");
const authMiddleware = require("../middleware/authMiddleware");
const dbUserMiddleware = require("../middleware/dbUserMiddleware");

/**
 * @route   GET /api/users/me
 * @desc    Get current logged-in user's profile
 * @access  Protected (requires Firebase ID token)
 */
router.get("/me", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const user = req.dbUser;

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        rollNo: user.rollNo,
        teacherId: user.teacherId,
        department: user.department,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user profile",
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/users/me
 * @desc    Update current user's profile
 * @access  Protected (requires Firebase ID token)
 * @body    { name?, phone?, department? }
 */
router.put("/me", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const { name, phone, department } = req.body;
    const user = req.dbUser;

    // Update only allowed fields
    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (department) user.department = department.trim();

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        rollNo: user.rollNo,
        teacherId: user.teacherId,
        department: user.department,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map(err => err.message)
        .join(", ");
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages}`,
        error: "VALIDATION_ERROR"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin/staff access)
 * @access  Protected (requires Firebase ID token)
 */
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    let user = await User.findById(req.params.id);

    if (!user) {
      user = await Staff.findById(req.params.id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

    return res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        rollNo: user.rollNo,
        teacherId: user.teacherId,
        department: user.department,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message
    });
  }
});

module.exports = router;