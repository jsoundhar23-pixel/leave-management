import express from "express";
import {
  getDepartments,
  addDepartment,
  deleteDepartment,
  assignAdvisor,
  assignHod,
} from "../controllers/adminController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware, adminMiddleware);

router.get("/", getDepartments);
router.post("/", addDepartment);
router.delete("/:id", deleteDepartment);
router.put("/:id/advisor", assignAdvisor);
router.put("/:id/hod", assignHod);

export default router;
