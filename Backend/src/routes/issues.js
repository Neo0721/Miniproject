const router = require("express").Router();
const Issue = require("../models/Issue");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const dbUserMiddleware = require("../middleware/dbUserMiddleware");

/**
 * @route   POST /api/issues
 * @desc    Create a new issue
 * @access  Protected (requires Firebase ID token)
 * @body    { title, category, location, description, priority?, imageBase64? }
 */
router.post("/", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const user = req.dbUser;

    const {
      title,
      category,
      location,
      description,
      priority,
      department,
      building,
      floor,
      room,
      tags,
      timetableImpact,
      attachments,
      assetId,
      imageBase64
    } = req.body;

    // Validation
    if (!title || !category || !location || !description) {
      return res.status(400).json({
        success: false,
        message: "Title, category, location, and description are required",
        error: "VALIDATION_ERROR"
      });
    }

    const validCategories = [
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
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        error: "INVALID_CATEGORY"
      });
    }

    const issueData = {
      title: title.trim(),
      category: category.trim(),
      location: location.trim(),
      description: description.trim(),
      reportedBy: new (require("mongoose")).Types.ObjectId(user._id),
      priority: priority || "medium",
      department: (req.body.department || category).trim(),
      building: building ? building.trim() : undefined,
      floor: floor ? floor.trim() : undefined,
      room: room ? room.trim() : undefined,
      tags: Array.isArray(tags) ? tags : [],
      timetableImpact: timetableImpact === true || timetableImpact === 'true',
      attachments: Array.isArray(attachments) ? attachments.map(a => ({
        name: a.name,
        type: a.type,
        size: a.size,
        dataUrl: a.dataUrl,
        uploadedAt: a.uploadedAt || new Date()
      })) : [],
      assetId: assetId ? assetId.trim() : undefined
    };

    // Add image if provided
    if (imageBase64) {
      issueData.imageUrl = imageBase64;
    } else if (issueData.attachments.length > 0) {
      // Fallback: use first attachment as the primary imageUrl
      issueData.imageUrl = issueData.attachments[0].dataUrl;
    }

    let issue = await Issue.create(issueData);

    // Smart Round-Robin Assignment
    const AssignmentService = require("../services/AssignmentService");
    const assignedStaff = await AssignmentService.assignToStaff(issue);

    // Populate the reportedBy and assignedTo fields for notification and response
    issue = await Issue.findById(issue._id)
      .populate("reportedBy", "name email role department")
      .populate("assignedTo", "name email department");

    // Trigger dynamic notifications (Non-blocking)
    const NotificationService = require("../services/NotificationService");
    NotificationService.triggerNewIssueAlert(issue);

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      issue: {
        _id: issue._id,
        title: issue.title,
        category: issue.category,
        location: issue.location,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        imageUrl: issue.imageUrl,
        attachments: issue.attachments,
        reportedBy: issue.reportedBy,
        building: issue.building,
        floor: issue.floor,
        room: issue.room,
        tags: issue.tags,
        timetableImpact: issue.timetableImpact,
        assetId: issue.assetId,
        department: issue.department,
        createdAt: issue.createdAt
      }
    });
  } catch (error) {
    console.error("Create issue error:", error);
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
      message: "Error creating issue",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/issues/my
 * @desc    Get all issues created by the logged-in user
 * @access  Protected (requires Firebase ID token)
 * @query   { status?, category?, sort?, limit?, page? }
 */
router.get("/my", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const user = req.dbUser;

    const { status, category, sort = "-createdAt", limit = 10, page = 1 } = req.query;

    const query = { reportedBy: user._id };

    // Apply filters
    if (status) {
      if (!["pending", "in_progress", "resolved"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
          error: "INVALID_STATUS"
        });
      }
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Issue.countDocuments(query);

    // Get issues with pagination
    const issues = await Issue.find(query)
      .populate("reportedBy", "name email role department")
      .populate("assignedTo", "name email department")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    console.log(`[BACKEND DEBUG] Found ${issues.length} issues for user ${user.email}`);

    return res.json({
      success: true,
      issues: issues.map(issue => ({
        _id: issue._id,
        title: issue.title,
        category: issue.category,
        location: issue.location,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        reportedBy: issue.reportedBy,
        assignedTo: issue.assignedTo,
        resolution: issue.resolution,
        building: issue.building,
        floor: issue.floor,
        room: issue.room,
        tags: issue.tags,
        timetableImpact: issue.timetableImpact,
        assetId: issue.assetId,
        department: issue.department,
        attachments: issue.attachments,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolvedAt: issue.resolvedAt,
        rating: issue.rating,
        resolutionEvidence: issue.resolutionEvidence,
        comments: issue.comments,
        statusUpdates: issue.statusUpdates,
        reopenedCount: issue.reopenedCount,
        canReopenUntil: issue.canReopenUntil,
        escalated: issue.escalated,
        escalatedAt: issue.escalatedAt
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Get my issues error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching issues",
      error: error.message
    });
  }
});

/**
 * @route   GET /api/issues/:id
 * @desc    Get a specific issue by ID
 * @access  Protected (requires Firebase ID token)
 */
router.get("/:id", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("reportedBy", "name email role department")
      .populate("assignedTo", "name email department");

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        error: "ISSUE_NOT_FOUND"
      });
    }

    const user = req.dbUser;
    const isAdmin = user.role === "admin";
    const isReporter = issue.reportedBy._id.toString() === user._id.toString();
    const isAssignee = issue.assignedTo?._id.toString() === user._id.toString();
    const isResolvingStaff = user.role === "resolving_staff" || user.role === "staff";

    // Permission check: only admin, reporter, assignee, or any staff can view details
    if (!isAdmin && !isReporter && !isAssignee && !isResolvingStaff) {
      return res.status(403).json({ success: false, message: "Access denied to this issue" });
    }

    return res.json({
      success: true,
      issue: {
        _id: issue._id,
        title: issue.title,
        category: issue.category,
        location: issue.location,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        imageUrl: issue.imageUrl,
        reportedBy: issue.reportedBy,
        assignedTo: issue.assignedTo,
        resolution: issue.resolution,
        building: issue.building,
        floor: issue.floor,
        room: issue.room,
        tags: issue.tags,
        timetableImpact: issue.timetableImpact,
        assetId: issue.assetId,
        department: issue.department,
        attachments: issue.attachments,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolvedAt: issue.resolvedAt,
        rating: issue.rating,
        resolutionEvidence: issue.resolutionEvidence,
        comments: issue.comments,
        statusUpdates: issue.statusUpdates,
        internalNotes: (req.user.role === 'staff' || req.user.role === 'admin') ? issue.internalNotes : [],
        reopenedCount: issue.reopenedCount,
        canReopenUntil: issue.canReopenUntil,
        escalated: issue.escalated,
        escalatedAt: issue.escalatedAt
      }
    });
  } catch (error) {
    console.error("Get issue error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching issue",
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/issues/:id
 * @desc    Update an issue (creator can update details, staff can update status)
 * @access  Protected (requires Firebase ID token)
 * @body    { status?, priority?, resolution?, assignedTo? }
 */
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { status, priority, resolution, assignedTo } = req.body;

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        error: "ISSUE_NOT_FOUND"
      });
    }

    const user = await User.findOne({ email: req.user.email });

    // Check authorization - only creator or staff can update
    if (
      issue.reportedBy.toString() !== user._id.toString() &&
      user.role !== "teacher"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this issue",
        error: "UNAUTHORIZED"
      });
    }

    // Update allowed fields
    if (status && ["pending", "in_progress", "resolved"].includes(status)) {
      issue.status = status;
      if (status === "resolved") {
        issue.resolvedAt = new Date();
      }
    }

    if (priority && ["low", "medium", "high"].includes(priority)) {
      issue.priority = priority;
    }

    if (resolution) {
      issue.resolution = resolution.trim();
    }

    if (assignedTo) {
      issue.assignedTo = assignedTo;
    }

    await issue.save();

    // Populate before returning
    await issue.populate("reportedBy", "name email role department");
    await issue.populate("assignedTo", "name email department");

    return res.json({
      success: true,
      message: "Issue updated successfully",
      issue: {
        _id: issue._id,
        title: issue.title,
        category: issue.category,
        location: issue.location,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        reportedBy: issue.reportedBy,
        assignedTo: issue.assignedTo,
        resolution: issue.resolution,
        department: issue.department,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolvedAt: issue.resolvedAt
      }
    });
  } catch (error) {
    console.error("Update issue error:", error);

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
      message: "Error updating issue",
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/issues/:id
 * @desc    Action-based partial update (status, assign, comment, evidence, etc.)
 * @access  Protected
 */
router.patch("/:id", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const { action, ...payload } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const user = req.dbUser;
    const who = user.name;
    const isAdmin = user.role === "admin";
    const isReporter = issue.reportedBy.toString() === user._id.toString();
    const isAssignee = issue.assignedTo?.toString() === user._id.toString();

    // Permission Logic
    if (!isAdmin) {
      if (["edit", "reopen", "rate", "resolution-feedback"].includes(action)) {
        if (!isReporter) return res.status(403).json({ success: false, message: "Only reporter can perform this action" });
      } else if (["status", "assign", "internal-note"].includes(action)) { // Removed "resolve" as there's no "resolve" case
        if (user.role !== "resolving_staff" || !isAssignee) {
          return res.status(403).json({ success: false, message: "Only assigned resolving staff can manage this issue" });
        }
      }
    }
    switch (action) {
      case "status":
        if (payload.status) {
          // Normalize status from frontend (in-progress) to backend (in_progress)
          const normalizedStatus = payload.status === "in-progress" ? "in_progress" : payload.status;
          issue.status = normalizedStatus;
          issue.statusUpdates.push({
            status: normalizedStatus,
            message: payload.message || `Status changed to ${normalizedStatus}`,
            by: who
          });
          if (normalizedStatus === "resolved") {
            issue.resolvedAt = new Date();
            // Notify reporter that their issue was resolved (non-blocking)
            setImmediate(async () => {
              try {
                const NotificationService = require("../services/NotificationService");
                const fullIssue = await Issue.findById(issue._id).populate("reportedBy", "name email fcmToken");
                if (fullIssue) NotificationService.triggerResolutionAlert(fullIssue);
              } catch (e) { /* silent */ }
            });
          }
        }
        break;


      case "assign":
        if (payload.assignee) {
          issue.assignedTo = payload.assignee;
        }
        break;

      case "comment":
        if (payload.message) {
          issue.comments.push({
            author: who,
            role: payload.role || user?.role || "student",
            message: payload.message
          });
        }
        break;

      case "evidence":
        issue.resolutionEvidence = {
          checklist: payload.checklist,
          afterAttachments: payload.afterAttachments || [],
          note: payload.note,
          updatedAt: new Date()
        };
        break;

      case "internal-note":
        if (payload.message) {
          issue.internalNotes.push({
            author: who,
            message: payload.message
          });
        }
        break;

      case "edit":
        // Allow updating metadata fields
        const allowedFields = [
          "title", "description", "category", "subCategory", "department",
          "location", "building", "floor", "room", "assetId", "priority", "tags", "timetableImpact"
        ];
        allowedFields.forEach(field => {
          if (payload[field] !== undefined) {
            issue[field] = payload[field];
          }
        });
        break;

      case "reopen":
        issue.status = "pending";
        issue.reopenedCount = (issue.reopenedCount || 0) + 1;
        issue.reopenReasonCategory = payload.reasonCategory;
        issue.statusUpdates.push({
          status: "pending",
          message: payload.message || "Issue reopened",
          by: who
        });
        issue.resolvedAt = null;
        break;

      case "rate":
        issue.rating = {
          score: payload.score,
          feedback: payload.feedback,
          by: who,
          ratedAt: new Date()
        };
        break;

      case "resolution-feedback":
        issue.resolutionConfirmation = payload.value;
        issue.resolutionConfirmationAt = new Date();
        break;

      default:
        return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
    }

    await issue.save();

    // Populate and return the full issue
    await issue.populate("reportedBy", "name email role department");
    await issue.populate("assignedTo", "name email role department");

    return res.json({
      success: true,
      message: `Action ${action} completed successfully`,
      issue
    });
  } catch (error) {
    console.error("PATCH issue error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing issue action",
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/issues/:id
 * @desc    Delete an issue (only creator can delete)
 * @access  Protected (requires Firebase ID token)
 */
router.delete("/:id", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        error: "ISSUE_NOT_FOUND"
      });
    }

    const user = req.dbUser;

    // Only creator can delete
    if (issue.reportedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the creator can delete this issue",
        error: "UNAUTHORIZED"
      });
    }

    await Issue.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    console.error("Delete issue error:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting issue",
      error: error.message
    });
  }
});

router.get("/", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const user = req.dbUser;
    const isAdmin = user.role === "admin";
    const isResolvingStaff = user.role === "resolving_staff" || user.role === "staff";

    if (!isAdmin && !isResolvingStaff) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { status, category, department, priority, escalated, assigned, sort = "-createdAt", limit = 20, page = 1 } = req.query;

    const query = {};

    // Resolving staff can only see issues assigned to them (as per requirement)
    if (isResolvingStaff && !isAdmin) {
      query.assignedTo = user._id;
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (department) {
      query.department = department;
    }

    if (priority) {
      query.priority = priority;
    }

    if (escalated) {
      query.escalated = escalated === "true";
    }

    if (assigned === "Assigned") {
      query.assignedTo = { $ne: null };
    } else if (assigned === "Unassigned") {
      query.assignedTo = null;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Issue.countDocuments(query);

    const issues = await Issue.find(query)
      .populate("reportedBy", "name email role department")
      .populate("assignedTo", "name email department")
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    return res.json({
      success: true,
      issues: issues.map(issue => ({
        _id: issue._id,
        title: issue.title,
        category: issue.category,
        location: issue.location,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        imageUrl: issue.imageUrl,
        reportedBy: issue.reportedBy,
        assignedTo: issue.assignedTo,
        building: issue.building,
        floor: issue.floor,
        room: issue.room,
        tags: issue.tags,
        timetableImpact: issue.timetableImpact,
        assetId: issue.assetId,
        department: issue.department,
        attachments: issue.attachments,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        rating: issue.rating,
        resolutionEvidence: issue.resolutionEvidence,
        comments: issue.comments,
        statusUpdates: issue.statusUpdates,
        internalNotes: (req.user.role === 'staff' || req.user.role === 'admin') ? issue.internalNotes : []
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error("Get issues error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching issues",
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/issues/bulk-assign
 * @desc    Assign multiple issues to a staff member
 * @access  Protected (Admin only)
 */
router.put("/bulk-assign", authMiddleware, dbUserMiddleware, async (req, res) => {
  try {
    const user = req.dbUser;
    if (user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const { issueIds, staffId } = req.body;

    if (!issueIds || !Array.isArray(issueIds) || !staffId) {
      return res.status(400).json({ success: false, message: "issueIds and staffId are required" });
    }

    const result = await Issue.updateMany(
      { _id: { $in: issueIds } },
      {
        $set: {
          assignedTo: staffId,
          status: "approved",
          assignedAt: new Date()
        }
      }
    );

    // Update staff active issues count
    const Staff = require("../models/Staff");
    await Staff.findByIdAndUpdate(staffId, { $inc: { currentActiveIssues: issueIds.length } });

    return res.json({
      success: true,
      message: `Successfully assigned ${result.modifiedCount} issues`,
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error("Bulk assign issues error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing bulk assignment",
      error: error.message
    });
  }
});

module.exports = router;
