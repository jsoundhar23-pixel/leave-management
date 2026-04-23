/* global process */
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import hodRoutes from "./routes/hodRoutes.js";

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  try {
    console.log("REQ:", req.method, req.url, "BODY:", req.body || {});
  } catch (e) {}

  const start = Date.now();

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      console.log(
        `RESP ${res.statusCode} ${res.statusMessage} - ${req.method} ${req.url} - ${Date.now() - start}ms`
      );
      try {
        console.log("REQ BODY AT ERROR:", req.body || {});
      } catch (e) {}
    }
  });

  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/hod", hodRoutes);

// Serve frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.join(__dirname, "../frontend/dist");

if (process.env.NODE_ENV === "production" && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Leave Management API is running 🚀");
  });
}

// ✅ FIXED PORT & HOST (IMPORTANT)
const PORT = process.env.PORT || 5000;

// Start server
const startServer = (port) => {
  const srv = app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${port}`);
  });

  srv.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.error(`Port ${port} is in use. Trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
};

startServer(PORT);