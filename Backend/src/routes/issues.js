const router = require("express").Router();
const Issue = require("../models/Issue");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * @route   POST /api/issues
 * @desc    Create a new issue
 * @access  Protected (requires Firebase ID token)
 * @body    { title, category, location, description, priority?, imageBase64? }
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, category, location, description, priority, imageBase64 } = req.body;

    // Find the user who is reporting the issue
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
        error: "USER_NOT_FOUND"
      });
    }

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
      "Other"
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
      reportedBy: user._id,
      priority: priority || "medium"
    };

    // Add image if provided
    if (imageBase64) {
      issueData.imageUrl = imageBase64;
    }

    const issue = await Issue.create(issueData);

    // Populate the reportedBy field
    await issue.populate("reportedBy", "name email role department");

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
        reportedBy: issue.reportedBy,
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
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        error: "USER_NOT_FOUND"
      });
    }

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
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolvedAt: issue.resolvedAt
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
router.get("/:id", authMiddleware, async (req, res) => {
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
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
        resolvedAt: issue.resolvedAt
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
 * @route   DELETE /api/issues/:id
 * @desc    Delete an issue (only creator can delete)
 * @access  Protected (requires Firebase ID token)
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
        error: "ISSUE_NOT_FOUND"
      });
    }

    const user = await User.findOne({ email: req.user.email });

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

/**
 * @route   GET /api/issues
 * @desc    Get all issues (with filters) - mainly for staff/admin
 * @access  Protected (requires Firebase ID token)
 * @query   { status?, category?, department?, sort?, limit?, page? }
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { status, category, department, sort = "-createdAt", limit = 20, page = 1 } = req.query;

    const query = {};

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
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt
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

module.exports = router;