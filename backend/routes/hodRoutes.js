import express from "express";
import {
  getHodProfile,
  getHodDashboard,
  approveLeave,
  getHodStats,
} from "../controllers/hodController.js";

import {
  authMiddleware,
  hodMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Dashboard
router.get(
  "/dashboard",
  authMiddleware,
  hodMiddleware,
  getHodDashboard
);

// Stats
router.get(
  "/stats",
  authMiddleware,
  hodMiddleware,
  getHodStats
);

// Profile
router.get(
  "/profile",
  authMiddleware,
  hodMiddleware,
  getHodProfile
);

// Approve / Reject (student + staff)
router.put(
  "/leave/:leaveId",
  authMiddleware,
  hodMiddleware,
  approveLeave
);

export default router;
