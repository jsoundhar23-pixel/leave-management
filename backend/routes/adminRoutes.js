import express from "express";
import {
  approveUser,
  rejectUser,
  getDepartments,
  getStaff,
  getHods,
  getPendingUsers,
  addDepartment,
  deleteDepartment,
  assignAdvisor,
  assignHod,
  createSemester,
  updateSemester,
  deleteSemester,
  getActiveSemester,
} from "../controllers/adminController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

/* ========= USERS ========= */
router.get("/pending", getPendingUsers);
router.put("/approve/:id", approveUser);
router.delete("/reject/:id", rejectUser);
router.get("/staff", getStaff);
router.get("/hod", getHods);

/* ========= SEMESTER ========= */
router.post("/semester", createSemester);
router.put("/semester/:id", updateSemester);
router.delete("/semester/:id", deleteSemester);
router.get("/semester/active", getActiveSemester);

/* ========= DEPARTMENTS ========= */
router.get("/department", getDepartments);
router.post("/department", addDepartment);
router.delete("/department/:id", deleteDepartment);
router.put("/department/:id/advisor", assignAdvisor);
router.put("/department/:id/hod", assignHod);

export default router;
