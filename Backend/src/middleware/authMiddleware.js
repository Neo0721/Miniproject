// Import the initialized Firebase Admin instance
const admin = require("../config/firebase-admin");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const devEmail = req.headers['x-user-email'];

    // Development Bypass: If no auth header but x-user-email is provided
    if (!authHeader && devEmail) {
      console.log(`[AUTH DEBUG] Attempting dev bypass for: ${devEmail}`);

      const User = require("../models/User");
      let targetUser = await User.findOne({ email: devEmail });

      if (!targetUser) {
        console.log(`[AUTH DEBUG] User ${devEmail} not found, falling back to any existing user`);
        targetUser = await User.findOne();
      }

      if (targetUser) {
        req.user = {
          uid: targetUser.firebaseUid || `dev_${targetUser.email}`,
          email: targetUser.email,
          name: targetUser.name,
          firebase_uid: targetUser.firebaseUid || `dev_${targetUser.email}`
        };
        console.log(`[AUTH DEBUG] Logged in as: ${targetUser.email}`);
        return next();
      } else {
        console.error("[AUTH DEBUG] Dev bypass failed: No users exist in database.");
        // Fall through to 401 if no user at all
      }
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing or invalid format",
        error: "MISSING_TOKEN"
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || "",
        firebase_uid: decodedToken.uid
      };

      next();
    } catch (error) {
      console.error("Token verification error:", error.message);

      if (error.code === "auth/id-token-expired") {
        return res.status(401).json({
          success: false,
          message: "Token has expired",
          error: "TOKEN_EXPIRED"
        });
      }

      if (error.code === "auth/invalid-id-token") {
        return res.status(401).json({
          success: false,
          message: "Invalid or malformed token",
          error: "INVALID_TOKEN"
        });
      }

      return res.status(401).json({
        success: false,
        message: "Failed to verify token",
        error: "TOKEN_VERIFICATION_FAILED"
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication service error",
      error: "AUTH_SERVICE_ERROR"
    });
  }
};

module.exports = authMiddleware;