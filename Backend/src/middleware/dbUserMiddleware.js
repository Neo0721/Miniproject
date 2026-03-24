const User = require("../models/User");
const Staff = require("../models/Staff");

/**
 * Middleware: populates req.dbUser from either User or Staff collection
 * based on the firebaseUid (from authMiddleware).
 */
const dbUserMiddleware = async (req, res, next) => {
    try {
        // If authMiddleware already set the dbUser (e.g. dev bypass), we can skip the lookup
        if (req.dbUser) {
            return next();
        }

        const firebaseUid = req.user?.uid;

        if (!firebaseUid) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
                error: "UNAUTHORIZED"
            });
        }

        // Check User collection (Students, Admins)
        let dbUser = await User.findOne({ firebaseUid });

        if (!dbUser) {
            // Check Staff collection (Teachers, Resolving Staff)
            dbUser = await Staff.findOne({ firebaseUid });
        }

        if (!dbUser) {
            return res.status(404).json({
                success: false,
                message: "User record not found in database",
                error: "USER_NOT_FOUND"
            });
        }

        // Allow access even for pending staff - they will land on Teacher Dashboard to report issues
        // UI and route-level role checks will handle specific lockdowns
        req.dbUser = dbUser;
        next();
    } catch (error) {
        console.error("dbUserMiddleware error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error during user lookup",
            error: error.message
        });
    }
};

module.exports = dbUserMiddleware;
