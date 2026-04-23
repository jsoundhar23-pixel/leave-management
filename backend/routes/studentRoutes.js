import express from "express";
import {
  applyStudentLeave,
  getStudentLeaves,
  getStudentDashboard,
  cancelStudentLeave,
  getStudentNotifications
} from "../controllers/studentController.js";

import {
  authMiddleware,
  studentMiddleware,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  studentMiddleware,
  getStudentDashboard
);

router.post(
  "/leave",
  authMiddleware,
  studentMiddleware,
  applyStudentLeave
);

router.get(
  "/leaves",
  authMiddleware,
  studentMiddleware,
  getStudentLeaves
);

router.delete(
  "/leave/:id",
  authMiddleware,
  studentMiddleware,
  cancelStudentLeave
);

router.get(
  "/notifications",
  authMiddleware,
  studentMiddleware,
  getStudentNotifications
);

export default router;
