import express from "express";
import {
  getStaffProfile,
  getStaffDashboard,
  approveLeave,
  applyStaffLeave,
} from "../controllers/staffController.js";

import {
  authMiddleware,
  staffMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, staffMiddleware, getStaffProfile);

/* ✅ DASHBOARD (student + staff leaves + pagination) */
router.get("/dashboard", authMiddleware, staffMiddleware, getStaffDashboard);

router.put("/approve/:leaveId", authMiddleware, staffMiddleware, approveLeave);

router.post("/leave", authMiddleware, staffMiddleware, applyStaffLeave);

export default router;
