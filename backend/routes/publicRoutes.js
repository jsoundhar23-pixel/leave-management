import express from "express";
import Leave from "../models/Leave.js";

const router = express.Router();

router.get("/verify/:id", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("student", "name email year")
      .populate("staff", "name email")
      .populate("department", "name");

    if (!leave) {
      return res.status(404).json({ valid: false, message: "Leave record not found" });
    }

    if (leave.status !== "Approved-HOD") {
      return res.json({ 
        valid: false, 
        message: "This leave request has not been fully approved.",
        status: leave.status 
      });
    }

    res.json({
      valid: true,
      data: {
        id: leave._id,
        name: leave.student ? leave.student.name : leave.staff?.name,
        role: leave.student ? "Student" : "Staff",
        department: leave.department?.name,
        fromDate: leave.fromDate,
        toDate: leave.toDate,
        totalDays: leave.totalDays,
        reason: leave.reason,
        status: leave.status,
        approvedAt: leave.updatedAt
      }
    });
  } catch (err) {
    res.status(500).json({ valid: false, message: "Invalid verification link or server error" });
  }
});

export default router;
