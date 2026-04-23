import express from "express";
import {
  applyStudentLeave,
  getStudentLeaves,
  getStudentDashboard,
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

export default router;
