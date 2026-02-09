const admin = require("firebase-admin");
const path = require("path");

if (!admin.apps.length) {
  try {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH not set");
    }

    const serviceAccount = require(
      path.resolve(serviceAccountPath)
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized successfully");

  } catch (err) {
    console.error("🔥 Firebase Admin init failed:", err.message);
  }
}

module.exports = admin;
