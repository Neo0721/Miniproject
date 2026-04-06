const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

/**
 * Initialize Firebase Admin SDK
 * - Loads credentials from FIREBASE_SERVICE_ACCOUNT_PATH
 * - Ensures it's initialized only once
 * - Fails loudly if credentials are missing
 */

let firebaseAdmin = null;

function initializeFirebaseAdmin() {
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log("✅ Firebase Admin already initialized");
      return admin;
    }

    let serviceAccount;

    // 1. Prioritize raw JSON string from environment variables (great for cloud like Vercel/Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      } catch (err) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not a strictly valid JSON string: " + err.message);
      }
    } else {
      // 2. Fallback to file-based loading (Local Dev or Render Secret Files)
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "src/config/firebase-admin.json";

      // Build candidate paths to look for the credentials file
      const candidates = [
        path.resolve(serviceAccountPath),
        path.resolve(process.cwd(), serviceAccountPath),
        path.resolve(__dirname, serviceAccountPath),
        path.resolve(__dirname, "firebase-admin.json"),
        path.resolve(process.cwd(), "src/config/firebase-admin.json"),
        "/etc/secrets/firebase-admin.json" // Render native Secret File path
      ];

      // Deduplicate
      const tried = [...new Set(candidates)];

      // Find first existing file
      let foundPath = null;
      for (const p of tried) {
        if (fs.existsSync(p)) {
          foundPath = p;
          break;
        }
      }

      if (!foundPath) {
        console.error("Tried these paths:");
        tried.forEach(p => console.error(`  - ${p}`));
        throw new Error(
          `Firebase credentials file not found at any of the expected locations. ` +
          `Please set FIREBASE_SERVICE_ACCOUNT_JSON environment variable with your raw JSON, ` +
          `or set FIREBASE_SERVICE_ACCOUNT_PATH to a valid relative path.`
        );
      }

      // Load credentials from file
      serviceAccount = require(foundPath);
    }

    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error(
        "Invalid Firebase credentials: missing project_id, private_key, or client_email. " +
        "Please verify your firebase-admin.json is correct."
      );
    }

    // Initialize Firebase Admin SDK
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    console.log("✅ Firebase Admin initialized successfully");
    console.log(`   Project ID: ${serviceAccount.project_id}`);

    return admin;
  } catch (err) {
    console.error("❌ Firebase Admin initialization failed:");
    console.error(`   Error: ${err.message}`);
    console.error("\n⚠️  CRITICAL: Server cannot start without Firebase Admin.");
    console.error("   Please fix the Firebase configuration and restart.\n");
    throw err; // Re-throw to prevent server from starting
  }
}

// Initialize immediately
firebaseAdmin = initializeFirebaseAdmin();

module.exports = firebaseAdmin;
