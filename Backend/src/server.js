// MUST load dotenv FIRST, before any other imports
require("dotenv").config();

// Verify critical environment variables are loaded
console.log("[ENV LOAD DEBUG]", {
  PORT: process.env.PORT,
  FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  MONGO_URI: process.env.MONGO_URI ? "✓ SET" : "✗ MISSING"
});

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Connect to MongoDB
connectDB().then(() => {
  // Start Background Monitoring Service
  const MonitoringService = require("./services/MonitoringService");
  MonitoringService.start();

  // Start server only after database is connected
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log("\n============================================");
    console.log("Campus Issue Resolver Backend Server");
    console.log("============================================");
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`Server running on port: ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Frontend: ${process.env.FRONTEND_URL || "http://localhost:3000"}`);
    console.log("============================================\n");
  });

  // Handle graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully...");
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}).catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});