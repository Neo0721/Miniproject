const router = require("express").Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with Firebase token verification
 * @access  Protected (requires Firebase ID token)
 * @body    { name, email, role, phone?, rollNo?, teacherId?, department? }
 * @flow
 *   1. Frontend creates user in Firebase Auth (email + password)
 *   2. Frontend sends Firebase ID token to backend
 *   3. Backend verifies token using authMiddleware
 *   4. Backend saves user to MongoDB with firebaseUid
 *   5. Prevents duplicates by checking firebaseUid
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

    // Get email and UID from Firebase token (most reliable source)
    const tokenEmail = req.user.email;
    const firebaseUid = req.user.uid;

    // Use token email if not provided in body
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

    // Check if user already exists by firebaseUid (prevents duplicates)
    let user = await User.findOne({ firebaseUid });

    if (user) {
      // User already registered - return existing user
      return res.status(200).json({
        success: true,
        message: "User already registered",
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

    // Create new user with Firebase UID
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      role,
      firebaseUid, // Link to Firebase Auth
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

    console.log(`✅ New user registered: ${email} (${role})`);

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
 * @route   POST /api/auth/login
 * @desc    Login user and verify they exist in database
 * @access  Protected (requires Firebase ID token)
 * @flow
 *   1. Frontend authenticates with Firebase (email + password)
 *   2. Frontend gets Firebase ID token
 *   3. Frontend sends token to backend
 *   4. Backend verifies token using authMiddleware
 *   5. Backend checks if user exists in MongoDB
 *   6. If exists → allow login, return user data
 *   7. If not → return error asking to register first
 */
router.post("/login", authMiddleware, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const email = req.user.email;

    // Check if user exists in database
    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
        error: "USER_NOT_FOUND",
        actionRequired: "REGISTER"
      });
    }

    console.log(`✅ User login verified: ${email}`);

    return res.json({
      success: true,
      message: "Login successful",
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
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid and return user info
 * @access  Protected (requires Firebase ID token)
 * @flow
 *   1. Frontend sends Authorization: Bearer <token> header
 *   2. Backend verifies token using authMiddleware
 *   3. Backend fetches user data from MongoDB
 *   4. Returns user info if exists, error if not found
 */
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const user = await User.findOne({ firebaseUid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
        error: "USER_NOT_FOUND"
      });
    }

    return res.json({
      success: true,
      message: "Token verified and user found",
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

/**
 * @route   POST /api/auth/logout
 * @desc    Logout endpoint (mainly for cleanup on backend if needed)
 * @access  Protected (requires Firebase ID token)
 * @note    Frontend should also call Firebase signOut()
 */
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    // Note: Firebase handles logout on frontend
    // This endpoint is mainly for backend session cleanup if needed
    
    console.log(`✅ User logout: ${req.user.email}`);

    return res.json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Error during logout",
      error: error.message
    });
  }
});

/**
 * @route   POST /api/auth/create-staff-admin
 * @desc    Create a staff or admin account (for admin use only)
 * @access  Protected - verify Firebase token first (admin only)
 * @note    This is for creating staff/admin accounts without Firebase registration
 * @body    { name, email, role, phone?, department? }
 */
router.post("/create-staff-admin", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      email: bodyEmail,
      role,
      phone,
      department
    } = req.body;

    // Validation
    if (!name || !bodyEmail || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and role are required",
        error: "VALIDATION_ERROR"
      });
    }

    if (!["staff", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'staff' or 'admin'",
        error: "INVALID_ROLE"
      });
    }

    const email = bodyEmail.toLowerCase();

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
        error: "DUPLICATE_ENTRY"
      });
    }

    // Create user without Firebase UID (for staff/admin accounts managed by admins)
    const userData = {
      name: name.trim(),
      email,
      role,
      phone: phone ? phone.trim() : undefined,
      department: department ? department.trim() : undefined,
      firebaseUid: null // Staff/admin created by admin may not have Firebase account
    };

    // Remove undefined values
    Object.keys(userData).forEach(
      key => userData[key] === undefined && delete userData[key]
    );

    user = await User.create(userData);

    console.log(`✅ New ${role} account created: ${email}`);

    return res.status(201).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account created successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        department: user.department,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Create staff/admin error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `A user with this ${field} already exists`,
        error: "DUPLICATE_ENTRY",
        field
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error creating staff/admin account",
      error: error.message
    });
  }
});

module.exports = router;