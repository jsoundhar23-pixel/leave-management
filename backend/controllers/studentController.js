import User from "../models/User.js";
import Leave from "../models/Leave.js";
import Semester from "../models/Semester.js";

/* ================= STUDENT DASHBOARD ================= */
export const getStudentDashboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const student = await User.findById(req.user.id)
      .populate("department", "name")
      .select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const semester = await Semester.findOne({ active: true });

    let usedDays = 0;
    let approvedLeaveDays = 0;
    let totalSemesterDays = 0;
    let attendancePercent = 0;

    if (semester) {
      /* ===== NON REJECTED LEAVES ===== */
      const semesterLeaves = await Leave.find({
        student: student._id,
        semester: semester._id,
        status: { $ne: "Rejected-HOD" },
      });

      usedDays = semesterLeaves.reduce(
        (sum, l) => sum + (l.totalDays || 0),
        0
      );

      /* ===== APPROVED ONLY ===== */
      const approvedLeaves = semesterLeaves.filter(l =>
        l.status === "Approved-Staff" ||
        l.status === "Approved-HOD"
      );

      approvedLeaveDays = approvedLeaves.reduce(
        (sum, l) => sum + (l.totalDays || 0),
        0
      );

      /* ===== SEMESTER TOTAL DAYS ===== */
      const start = new Date(semester.startDate);
      const end = new Date(semester.endDate);

      totalSemesterDays =
        Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const attendanceDays =
        totalSemesterDays - approvedLeaveDays;

      attendancePercent =
        totalSemesterDays > 0
          ? Math.round((attendanceDays / totalSemesterDays) * 100)
          : 0;
    }

    /* ===== PAGINATION LEAVES ===== */

    const leaves = await Leave.find({
      student: student._id,
      semester: semester?._id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalLeaves = await Leave.countDocuments({
      student: student._id,
      semester: semester?._id,
    });

    res.json({
      student,
      semester,

      usedDays,
      maxLeave: semester?.maxLeaveDays || 0,

      totalSemesterDays,
      approvedLeaveDays,
      attendancePercent,

      leaves,

      pagination: {
        page,
        total: totalLeaves,
        totalPages: Math.ceil(totalLeaves / limit) || 1,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= GET STUDENT LEAVES ================= */
export const getStudentLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ student: req.user.id })
      .populate("semester", "name")
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch {
    res.status(500).json({ message: "Failed to fetch student leaves" });
  }
};


/* ================= APPLY STUDENT LEAVE ================= */
export const applyStudentLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;

    const student = await User.findById(req.user.id);
    const semester = await Semester.findOne({ active: true });

    if (!semester) {
      return res.status(400).json({ message: "No active semester" });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (start < semester.startDate || end > semester.endDate) {
      return res.status(400).json({
        message: "Leave must be within semester duration",
      });
    }

    const totalDays =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    const existingLeaves = await Leave.find({
      student: student._id,
      semester: semester._id,
      status: { $ne: "Rejected-HOD" },
    });

    const usedDays = existingLeaves.reduce(
      (sum, l) => sum + (l.totalDays || 0),
      0
    );

    const leave = await Leave.create({
      student: student._id,
      department: student.department,
      semester: semester._id,
      reason,
      fromDate,
      toDate,
      totalDays,
      status: "Pending-Staff",
    });

    const totalLeaveDays = usedDays + totalDays;
    const maxDays = semester.maxLeaveDays;
    const percentageUsed = Math.round((totalLeaveDays / maxDays) * 100);

    // ✅ Check if student reached 78% threshold
    if (percentageUsed >= 78) {
      return res.status(201).json({
        alert: true,
        alertType: "threshold",
        message: `⚠ Alert: You have used ${percentageUsed}% (${totalLeaveDays}/${maxDays} days) of your leave limit. Approval workflow initiated.`,
        percentageUsed,
        leave,
      });
    }

    if (totalLeaveDays > maxDays) {
      return res.status(201).json({
        alert: true,
        alertType: "exceeded",
        message: `⚠ Warning: ${totalLeaveDays}/${maxDays} days used (exceeded limit)`,
        leave,
      });
    }

    res.status(201).json({
      alert: false,
      message: "Leave applied successfully",
      leave,
    });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= CANCEL STUDENT LEAVE ================= */
export const cancelStudentLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.student.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (leave.status !== "Pending-Staff" && leave.status !== "Pending-HOD") {
      return res.status(400).json({ message: "Can only cancel pending leaves" });
    }

    await Leave.findByIdAndDelete(id);
    res.json({ message: "Leave request cancelled successfully" });
  } catch {
    res.status(500).json({ message: "Failed to cancel leave" });
  }
};

/* ================= NOTIFICATIONS ================= */
export const getStudentNotifications = async (req, res) => {
  try {
    const leaves = await Leave.find({ 
      student: req.user.id,
      status: { $in: ["Approved-HOD", "Rejected-HOD", "Rejected-Staff"] }
    })
    .sort({ updatedAt: -1 })
    .limit(5);
    
    res.json(leaves);
  } catch {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};
