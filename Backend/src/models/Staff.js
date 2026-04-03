const mongoose = require("mongoose");

/**
 * Staff schema — used for TEACHER and RESOLVING_STAFF accounts only.
 * Students remain in the User schema.
 *
 * Workflow:
 *   1. Teacher registers → role: "teacher", status: "pending"
 *   2. Admin approves   → role: "resolving_staff", status: "approved"
 */
const StaffSchema = new mongoose.Schema(
    {
        // Firebase reference (required for self-registered teachers)
        firebaseUid: {
            type: String,
            required: true,
            unique: true
        },

        // Basic info
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },

        // Role-specific identifiers
        teacherId: {
            type: String,
            trim: true,
            sparse: true
        },

        department: {
            type: String,
            trim: true
        },

        // Role: teacher (pending approval) → resolving_staff (approved)
        role: {
            type: String,
            enum: ["teacher", "resolving_staff"],
            default: "teacher"
        },

        // Approval status managed by admin
        status: {
            type: String,
            enum: ["pending", "approved"],
            default: "pending"
        },

        // Availability status for automated assignment
        availabilityStatus: {
            type: String,
            enum: ["available", "busy", "on_break", "offline"],
            default: "available"
        },

        // Track workload
        currentActiveIssues: {
            type: Number,
            default: 0
        },

        // FCM push notification token
        fcmToken: {
            type: String,
            trim: true,
            sparse: true
        }
    },
    { timestamps: true }
);

StaffSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model("Staff", StaffSchema);
