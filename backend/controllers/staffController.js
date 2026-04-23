import Leave from "../models/Leave.js";
import User from "../models/User.js";
import Semester from "../models/Semester.js";
import { sendEmail } from "../utils/sendEmail.js";
import { buildLeaveMessage } from "../utils/leaveMessage.js";

/* ================= PROFILE ================= */

export const getStaffProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("department");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= DASHBOARD ================= */

export const getStaffDashboard = async (req, res) => {
  try {
    const studentPage = parseInt(req.query.studentPage) || 1;
    const staffPage = parseInt(req.query.staffPage) || 1;
    const approvedPage = parseInt(req.query.approvedPage) || 1;

    const LIMIT = 10;

    // ACTIVE SEMESTER
    const semester = await Semester.findOne({ active: true });

    // STUDENT LEAVE REQUESTS (Pending-Staff and Pending-HOD - awaiting approval)
    const studentQuery = {
      status: { $in: ["Pending-Staff", "Pending-HOD"] },
      department: req.user.department,
    };

    const studentLeaves = await Leave.find(studentQuery)
      .populate("student", "name email")
      .populate("semester", "name startDate endDate maxLeaveDays")
      .sort({ createdAt: -1 })
      .skip((studentPage - 1) * LIMIT)
      .limit(LIMIT);

    const studentCount = await Leave.countDocuments(studentQuery);

    // APPROVED STUDENT LEAVE HISTORY (Approved by both staff and HOD)
    const approvedStudentQuery = {
      status: "Approved-HOD",
      department: req.user.department,
      student: { $exists: true },
    };

    const approvedStudentLeaves = await Leave.find(approvedStudentQuery)
      .populate("student", "name email")
      .populate("semester", "name startDate endDate maxLeaveDays")
      .sort({ createdAt: -1 })
      .skip((approvedPage - 1) * LIMIT)
      .limit(LIMIT);

    const approvedStudentCount = await Leave.countDocuments(approvedStudentQuery);

    // STAFF OWN LEAVES
    const staffQuery = {
      staff: req.user._id,
    };

    const staffLeaves = await Leave.find(staffQuery)
      .populate("semester", "name startDate endDate maxLeaveDays")
      .sort({ createdAt: -1 })
      .skip((staffPage - 1) * LIMIT)
      .limit(LIMIT);

    const staffCount = await Leave.countDocuments(staffQuery);

    res.json({
      semester,
      studentLeaves,
      approvedStudentLeaves,
      staffLeaves,
      pagination: {
        student: {
          page: studentPage,
          totalPages: Math.ceil(studentCount / LIMIT),
        },
        approved: {
          page: approvedPage,
          totalPages: Math.ceil(approvedStudentCount / LIMIT),
        },
        staff: {
          page: staffPage,
          totalPages: Math.ceil(staffCount / LIMIT),
        },
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= APPROVE ================= */

export const approveLeave = async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findById(req.params.leaveId)
      .populate("student", "name email department year")
      .populate("department", "name");

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "Pending-Staff") {
      return res.status(400).json({ message: "Leave not in pending status" });
    }

    // If staff approves, forward to HOD for final approval
    if (status === "Approved-Staff") {
      leave.status = "Pending-HOD";
    } else if (status === "Rejected-Staff") {
      leave.status = "Rejected-Staff";
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    leave.reviewedByStaff = req.user._id;
    await leave.save();

    // ✅ SEND EMAIL TO STUDENT if rejected by staff
    if (leave.student && leave.student.email && status === "Rejected-Staff") {
      try {
        const message = buildLeaveMessage({
          name: leave.student.name,
          role: "Student",
          department: leave.department?.name || "Unknown",
          year: leave.student.year,
          status: "Rejected",
          reason: leave.reason,
          fromDate: leave.fromDate,
          toDate: leave.toDate,
        });

        await sendEmail(
          leave.student.email,
          "❌ Your Leave Request Rejected",
          message
        );
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
      }
    }

    res.json({ 
      message: status === "Approved-Staff" 
        ? "Leave approved and forwarded to HOD" 
        : "Leave rejected and email sent to student",
      leave 
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= APPLY STAFF LEAVE ================= */

export const applyStaffLeave = async (req, res) => {
  try {
    const { reason, fromDate, toDate } = req.body;

    const semester = await Semester.findOne({ active: true });
    const staff = await User.findById(req.user._id).populate("department", "name");

    const totalDays =
      Math.ceil((new Date(toDate) - new Date(fromDate)) / 86400000) + 1;

    // Get existing staff leaves to calculate total
    const existingLeaves = await Leave.find({
      staff: req.user._id,
      status: { $ne: "Rejected-HOD" },
    });

    const usedDays = existingLeaves.reduce(
      (sum, l) => sum + (l.totalDays || 0),
      0
    );

    const leave = await Leave.create({
      staff: req.user._id,
      department: req.user.department,
      reason,
      fromDate,
      toDate,
      totalDays,
      status: "Pending-HOD",
      semester: semester?._id,
    });

    const totalLeaveDays = usedDays + totalDays;

    // ✅ Check if staff reached 20 days threshold
    if (totalLeaveDays >= 20) {
      try {
        await sendEmail(
          staff.email,
          "⚠️ Maximum Leave Limit Alert - 20 Days Reached",
          `Dear ${staff.name},\n\nYou have reached the maximum leave limit of 20 days.\n\nCurrent Leave Details:\nDepartment: ${staff.department?.name || "Unknown"}\nFrom: ${new Date(fromDate).toLocaleDateString("en-IN")}\nTo: ${new Date(toDate).toLocaleDateString("en-IN")}\nDays: ${totalDays}\nReason: ${reason}\n\nTotal Leave Used: ${totalLeaveDays}/20 days\n\nPlease contact your Head of Department for further information.\n\nRegards,\nLeave Management System`
        );
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
      }

      return res.status(201).json({
        alert: true,
        alertType: "maximumReached",
        message: `⚠️ Alert: You have reached the maximum leave limit! Total leave: ${totalLeaveDays}/20 days. Email notification sent.`,
        totalLeaveDays,
        leave,
      });
    }

    res.status(201).json({
      alert: false,
      message: "Leave applied successfully",
      leave,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
