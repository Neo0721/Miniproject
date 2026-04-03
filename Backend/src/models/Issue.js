const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema({
  name: String,
  type: String,
  size: Number,
  dataUrl: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const CommentSchema = new mongoose.Schema({
  author: String,
  role: {
    type: String,
    enum: ["student", "teacher", "staff", "admin"],
    default: "student"
  },
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const StatusUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "in_progress", "resolved"]
  },
  message: String,
  by: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const InternalNoteSchema = new mongoose.Schema({
  author: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ResolutionEvidenceSchema = new mongoose.Schema({
  afterAttachments: [AttachmentSchema],
  checklist: {
    diagnosisDone: { type: Boolean, default: false },
    fixApplied: { type: Boolean, default: false },
    tested: { type: Boolean, default: false }
  },
  qualityScore: { type: Number, default: 0 },
  note: String,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

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
          "Other",
          "IT",
          "Canteen",
          "Labs",
          "Office",
          "Facilities",
          "Security",
          "Mechanical",
          "Electronics",
          "Civil",
          "Computer Engineering",
          "Administration"
        ],
        message: "Invalid category"
      }
    },
    department: {
      type: String,
      trim: true
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
    building: {
      type: String,
      trim: true
    },
    floor: {
      type: String,
      trim: true
    },
    room: {
      type: String,
      trim: true
    },
    tags: [String],
    timetableImpact: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "in_progress", "resolved", "escalated"],
        message: "Status must be 'pending', 'approved', 'in_progress', 'resolved', or 'escalated'"
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
      ref: "Staff",
      default: null
    },
    assignedAt: Date,
    acknowledgedAt: Date,
    slaDeadline: Date,
    reassignmentCount: {
      type: Number,
      default: 0
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
    attachments: [AttachmentSchema],
    imageUrl: {
      type: String,
      trim: true,
      default: null
    },
    comments: [CommentSchema],
    statusUpdates: [StatusUpdateSchema],
    internalNotes: [InternalNoteSchema],
    resolutionEvidence: {
      type: ResolutionEvidenceSchema,
      default: null
    },
    rating: {
      score: { type: Number, min: 1, max: 5 },
      feedback: String,
      by: String,
      ratedAt: Date
    },
    reopenReasonCategory: {
      type: String,
      enum: ["not-fixed", "recurring", "partial-fix", "wrong-issue", "other"]
    },
    reopenedCount: { type: Number, default: 0 },
    canReopenUntil: Date,
    escalated: { type: Boolean, default: false },
    escalatedAt: Date,
    resolvedAt: Date,
    lastReminderSentAt: {
      type: Date,
      default: null
    },
    assetId: {
      type: String,
      trim: true
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