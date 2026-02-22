const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const issueRoutes = require("./routes/issues");
const userRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/", (_, res) => {
  res.json({
    success: true,
    message: "Campus Issue Resolver Backend Running",
    version: "1.0.0",
    status: "healthy"
  });
});

app.get("/api/debug", (req, res) => {
  res.json({ ok: true, message: "API is reachable" });
});

// API// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/issues", require("./routes/issues"));
app.use("/api/users", require("./routes/users"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/staff", require("./routes/staff"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    error: "NOT_FOUND",
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);

  // Default error response
  const status = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    message,
    error: err.code || "INTERNAL_ERROR"
  });
});

module.exports = app;