const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: {
        values: [
          "Classroom Equipment",
          "WiFi / IT",
          "Hostel",
          "Library",
          "Infrastructure",
          "Maintenance",
          "Other"
        ],
        message: "Invalid category"
      }
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      minlength: [3, "Location must be at least 3 characters"],
      maxlength: [200, "Location cannot exceed 200 characters"]
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"]
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "in_progress", "resolved"],
        message: "Status must be 'pending', 'in_progress', or 'resolved'"
      },
      default: "pending"
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"]
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    resolution: {
      type: String,
      trim: true,
      maxlength: [2000, "Resolution cannot exceed 2000 characters"]
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
IssueSchema.index({ reportedBy: 1, createdAt: -1 });
IssueSchema.index({ status: 1 });
IssueSchema.index({ assignedTo: 1 });
IssueSchema.index({ category: 1 });

module.exports = mongoose.model("Issue", IssueSchema);