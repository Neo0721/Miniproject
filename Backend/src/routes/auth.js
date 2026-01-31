const router = require("express").Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user or retrieve existing user
 * @access  Protected (requires Firebase ID token)
 * @body    { name, email, role, phone?, rollNo?, teacherId?, department? }
 */
router.post("/register", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      email: bodyEmail,
      role,
      phone,
      rollNo,
      teacherId,
      department
    } = req.body;

    const tokenEmail = req.user.email;

    // Use Firebase email if not provided in body
    const email = bodyEmail || tokenEmail;

    // Validation
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and role are required",
        error: "VALIDATION_ERROR"
      });
    }

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'student' or 'teacher'",
        error: "INVALID_ROLE"
      });
    }

    // Additional validation for student/teacher specific fields
    if (role === "student" && !rollNo) {
      return res.status(400).json({
        success: false,
        message: "Roll number is required for students",
        error: "MISSING_ROLL_NO"
      });
    }

    if (role === "teacher" && !teacherId) {
      return res.status(400).json({
        success: false,
        message: "Teacher ID is required for teachers",
        error: "MISSING_TEACHER_ID"
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Return existing user
      return res.status(200).json({
        success: true,
        message: "User already exists",
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
    }

    // Create new user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      role,
      firebaseUid: req.user.uid,
      phone: phone ? phone.trim() : undefined,
      department: department ? department.trim() : undefined
    };

    // Add role-specific fields
    if (role === "student") {
      userData.rollNo = rollNo.trim();
    } else if (role === "teacher") {
      userData.teacherId = teacherId.trim();
    }

    // Remove undefined values
    Object.keys(userData).forEach(
      key => userData[key] === undefined && delete userData[key]
    );

    user = await User.create(userData);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
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
    console.error("Registration error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A user with this ${field} already exists`,
        error: "DUPLICATE_ENTRY",
        field
      });
    }

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
      message: "Error during registration",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid and return user info
 * @access  Protected (requires Firebase ID token)
 */
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
        error: "USER_NOT_FOUND"
      });
    }

    return res.json({
      success: true,
      message: "Token verified",
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
    console.error("Verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying token",
      error: error.message
    });
  }
});

module.exports = router;