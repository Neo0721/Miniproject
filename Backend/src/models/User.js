const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    // Firebase reference
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
      required: [true, "Firebase UID is required"]
    },

    // User info
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, "Please provide a valid phone number"],
      sparse: true
    },

    // Role management (CRITICAL: No trusting frontend)
    role: {
      type: String,
      enum: {
        values: ["student", "teacher", "staff", "admin"],
        message: "Role must be 'student', 'teacher', 'staff', or 'admin'"
      },
      required: [true, "Role is required"],
      default: "student"
    },

    // Role-specific fields
    rollNo: {
      type: String,
      trim: true,
      sparse: true
    },
    teacherId: {
      type: String,
      trim: true,
      sparse: true
    },
    staffId: {
      type: String,
      trim: true,
      sparse: true
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
      sparse: true
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
UserSchema.index({ firebaseUid: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ role: 1, createdAt: -1 });

module.exports = mongoose.model("User", UserSchema);