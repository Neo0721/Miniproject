const User = require("../models/User");

/**
 * Middleware to restrict routes to specific roles
 * IMPORTANT: Always used AFTER authMiddleware
 * @param {...string} allowedRoles - roles that can access the route
 */
function roleMiddleware(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: No user context",
          error: "NO_USER_CONTEXT"
        });
      }

      // Fetch user from database to get verified role
      const user = await User.findOne({ firebaseUid: req.user.uid });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found in database",
          error: "USER_NOT_FOUND"
        });
      }

      // Attach user to request for downstream use
      req.user.dbUser = user;
      req.user.role = user.role;

      // Check if user's role is allowed
      if (!allowedRoles.includes(user.role)) {
        console.warn(
          `⚠️ Unauthorized access attempt: ${user.email} (${user.role}) tried to access admin resource`
        );

        return res.status(403).json({
          success: false,
          message: `Access denied. This resource requires one of: ${allowedRoles.join(", ")}`,
          error: "FORBIDDEN",
          requiredRole: allowedRoles,
          userRole: user.role
        });
      }

      next();
    } catch (error) {
      console.error("Role middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Error verifying user role",
        error: error.message
      });
    }
  };
}

/**
 * Convenience middleware for specific roles
 */
const allowStudent = roleMiddleware("student");
const allowTeacher = roleMiddleware("teacher");
const allowStaff = roleMiddleware("staff");
const allowAdmin = roleMiddleware("admin");
const allowStaffAndAdmin = roleMiddleware("staff", "admin");
const allowTeacherStaffAdmin = roleMiddleware("teacher", "staff", "admin");

module.exports = {
  roleMiddleware,
  allowStudent,
  allowTeacher,
  allowStaff,
  allowAdmin,
  allowStaffAndAdmin,
  allowTeacherStaffAdmin
};
