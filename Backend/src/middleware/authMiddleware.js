// Import the initialized Firebase Admin instance
const admin = require("../config/firebase-admin");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

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