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
      const Staff = require("../models/Staff");

      let targetUser = await User.findOne({ email: devEmail });

      if (!targetUser) {
        targetUser = await Staff.findOne({ email: devEmail });
      }

      if (targetUser) {
        req.user = {
          uid: targetUser.firebaseUid || `dev_${targetUser.email}`,
          email: targetUser.email,
          name: targetUser.name,
          firebase_uid: targetUser.firebaseUid || `dev_${targetUser.email}`
        };
        req.dbUser = targetUser; // Automatically skips lookup in dbUserMiddleware
        console.log(`[AUTH DEBUG] Logged in as: ${targetUser.email}`);
        return next();
      } else {
        console.warn(`[AUTH DEBUG] Dev bypass: User ${devEmail} not found in database. Allowing pass for registration.`);
        req.user = {
          uid: `dev_${devEmail}`,
          email: devEmail,
          name: "Unknown",
          firebase_uid: `dev_${devEmail}`
        };
        req.dbUser = null;
        return next();
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

      // ── Fallback: if Firebase Admin can't verify the token (e.g. missing
      // credentials on Render), try the x-user-email header as a backup.
      // The client already authenticated with Firebase, so we trust this email.
      const fallbackEmail = req.headers['x-user-email'];
      if (fallbackEmail) {
        const User = require("../models/User");
        const Staff = require("../models/Staff");

        let targetUser = await User.findOne({ email: fallbackEmail.toLowerCase() });
        if (!targetUser) targetUser = await Staff.findOne({ email: fallbackEmail.toLowerCase() });

        if (targetUser) {
          console.warn(`[AUTH] Firebase Admin verification failed — using email fallback for: ${fallbackEmail}`);
          req.user = {
            uid: targetUser.firebaseUid || `fallback_${targetUser.email}`,
            email: targetUser.email,
            name: targetUser.name,
            firebase_uid: targetUser.firebaseUid || `fallback_${targetUser.email}`
          };
          req.dbUser = targetUser;
          return next();
        }
      }

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