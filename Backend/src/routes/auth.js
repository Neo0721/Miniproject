const router = require("express").Router();
const User = require("../models/User");
const Staff = require("../models/Staff");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * Helper: look up a user by firebaseUid in BOTH collections.
 * Returns { doc, collection: "User"|"Staff" } or null.
 */
async function findByFirebaseUid(firebaseUid) {
  const user = await User.findOne({ firebaseUid });
  if (user) return { doc: user, collection: "User" };
  const staff = await Staff.findOne({ firebaseUid });
  if (staff) return { doc: staff, collection: "Staff" };
  return null;
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with Firebase token verification
 * @access  Protected (requires Firebase ID token)
 * @body    { name, email, role, phone?, rollNo?, teacherId?, department? }
 * @flow
 *   1. Frontend creates user in Firebase Auth (email + password)
 *   2. Frontend sends Firebase ID token to backend
 *   3. Backend verifies token using authMiddleware
 *   4. Students  → saved to User  collection (role: student)
 *   5. Teachers  → saved to Staff collection (role: teacher, status: pending)
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

    // --- ROUTE BY ROLE ---
    if (role === "teacher") {
      // ✅ TEACHER → Staff collection only (NEVER User)
      let staff = await Staff.findOne({ firebaseUid });

      if (staff) {
        return res.status(200).json({
          success: true,
          message: "Staff already registered",
          user: {
            _id: staff._id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            status: staff.status,
            department: staff.department,
            teacherId: staff.teacherId,
            createdAt: staff.createdAt
          }
        });
      }

      const staffData = {
        firebaseUid,
        name: name.trim(),
        email: email.toLowerCase(),
        role: "teacher",
        status: "pending",
        phone: phone ? phone.trim() : undefined,
        department: department ? department.trim() : undefined,
        teacherId: teacherId ? teacherId.trim() : undefined
      };

      // Remove undefined values
      Object.keys(staffData).forEach(
        key => staffData[key] === undefined && delete staffData[key]
      );

      staff = await Staff.create(staffData);

      console.log(`✅ New teacher registered (pending): ${email}`);

      return res.status(201).json({
        success: true,
        message: "Teacher account created. Awaiting admin approval.",
        user: {
          _id: staff._id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
          status: staff.status,
          department: staff.department,
          teacherId: staff.teacherId,
          createdAt: staff.createdAt
        }
      });

    } else {
      // ✅ STUDENT → User collection only
      let user = await User.findOne({ firebaseUid });

      if (user) {
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
            department: user.department,
            createdAt: user.createdAt
          }
        });
      }

      const userData = {
        name: name.trim(),
        email: email.toLowerCase(),
        role,
        firebaseUid,
        phone: phone ? phone.trim() : undefined,
        department: department ? department.trim() : undefined,
        rollNo: rollNo ? rollNo.trim() : undefined
      };

      Object.keys(userData).forEach(
        key => userData[key] === undefined && delete userData[key]
      );

      user = await User.create(userData);

      console.log(`✅ New student registered: ${email}`);

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
          department: user.department,
          createdAt: user.createdAt
        }
      });
    }

  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A user with this ${field} already exists`,
        error: "DUPLICATE_ENTRY",
        field
      });
    }

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
 *   4. Backend checks User first, then Staff
 *   5. Returns user/staff data including status for teachers
 */
router.post("/login", authMiddleware, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const result = await findByFirebaseUid(firebaseUid);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
        error: "USER_NOT_FOUND",
        actionRequired: "REGISTER"
      });
    }

    const { doc, collection } = result;

    console.log(`✅ ${collection} login verified: ${doc.email}`);

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        _id: doc._id,
        name: doc.name,
        email: doc.email,
        role: doc.role,
        status: doc.status || null,         // null for students
        phone: doc.phone,
        rollNo: doc.rollNo || undefined,
        teacherId: doc.teacherId || undefined,
        department: doc.department,
        credits: doc.credits || 0,
        createdAt: doc.createdAt
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
 */
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const result = await findByFirebaseUid(firebaseUid);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
        error: "USER_NOT_FOUND"
      });
    }

    const { doc } = result;

    return res.json({
      success: true,
      message: "Token verified and user found",
      user: {
        _id: doc._id,
        name: doc.name,
        email: doc.email,
        role: doc.role,
        status: doc.status || null,
        phone: doc.phone,
        rollNo: doc.rollNo || undefined,
        teacherId: doc.teacherId || undefined,
        department: doc.department,
        credits: doc.credits || 0,
        createdAt: doc.createdAt
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
      firebaseUid: null
    };

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

/**
 * @route   POST /api/auth/forgot-password-email
 * @desc    Backup email delivery for forgot-password flow.
 *          Firebase's noreply@ emails often land in spam, so we send a
 *          second email via our own SMTP (Nodemailer / Gmail app-password)
 *          to improve deliverability. Always returns 200 to avoid leaking
 *          which email addresses are registered.
 * @access  Public (no auth needed — just an email address)
 * @body    { email }
 */
router.post("/forgot-password-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Log env var presence for debugging (never log actual values)
    console.log(`[ForgotPassword] Attempting to send to: ${normalizedEmail}`);
    console.log(`[ForgotPassword] EMAIL_USER set: ${!!process.env.EMAIL_USER}`);
    console.log(`[ForgotPassword] EMAIL_PASS set: ${!!process.env.EMAIL_PASS}`);
    console.log(`[ForgotPassword] EMAIL_FROM set: ${!!process.env.EMAIL_FROM}`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://miniproject-1t69.onrender.com";
    const loginUrl = `${appUrl}/login`;

    const subject = "🔑 Password Reset — Campus Care Desk (HCAP)";
    const html = `
      <div style="font-family:sans-serif;max-width:580px;margin:auto;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
        <div style="background:#1d4ed8;color:white;padding:20px 24px">
          <h2 style="margin:0;font-size:20px">🔑 Password Reset Request</h2>
          <p style="margin:6px 0 0;opacity:0.85;font-size:13px">Campus Care Desk — HCAP</p>
        </div>
        <div style="padding:24px">
          <p style="margin-top:0">Hi,</p>
          <p>We received a request to reset the password for your HCAP account (<strong>${normalizedEmail}</strong>).</p>
          <p>
            A password reset link has been sent by our authentication system (Firebase).<br/>
            <strong>Please check your Spam / Junk folder</strong> if you don't see it in your inbox
            — look for an email from <em>noreply@campus-issue-resolver-b66e4.firebaseapp.com</em>.
          </p>
          <p>Once you reset your password, sign back in here:</p>
          <p style="text-align:center;margin:24px 0">
            <a href="${loginUrl}" style="background:#1d4ed8;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
              Go to Login →
            </a>
          </p>
          <p style="font-size:13px;color:#6b7280">
            If you did not request a password reset, you can safely ignore this email.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0"/>
          <p style="font-size:11px;color:#9ca3af;margin:0">HCAP — Hyperlocal Community Action Platform</p>
        </div>
      </div>`;
    const text = `Password reset requested for ${normalizedEmail}.\n\nCheck Spam/Junk for the reset link from noreply@campus-issue-resolver-b66e4.firebaseapp.com\n\nLogin: ${loginUrl}`;

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: (process.env.EMAIL_USER || "").trim(),
        pass: (process.env.EMAIL_PASS || "").trim()
      },
      connectionTimeout: 15000,
      socketTimeout: 15000
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: normalizedEmail,
      subject,
      html,
      text
    });

    console.log(`[ForgotPassword] ✅ Email sent → ${normalizedEmail}`);
    return res.json({ success: true, message: "Reset email sent successfully." });

  } catch (err) {
    console.error(`[ForgotPassword] ❌ Failed:`, err.message, err.code || "");
    // Still return 200 to avoid leaking which emails are registered,
    // but log the error clearly on the server side.
    return res.json({ success: false, message: "Email could not be sent. Please try again.", error: err.message });
  }
});

module.exports = router;