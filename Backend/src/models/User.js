const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
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
      match: [/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, "Please provide a valid phone number"]
    },
    role: {
      type: String,
      enum: {
        values: ["student", "teacher"],
        message: "Role must be either 'student' or 'teacher'"
      },
      required: [true, "Role is required"]
    },
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
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"]
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true
    },
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

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ firebaseUid: 1 });

module.exports = mongoose.model("User", UserSchema);