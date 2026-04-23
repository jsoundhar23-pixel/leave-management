import User from "../models/User.js";
import Leave from "../models/Leave.js";
import Semester from "../models/Semester.js";
import { sendEmail } from "../utils/sendEmail.js";
import { buildLeaveMessage } from "../utils/leaveMessage.js";

const LIMIT = 10;

/* ================= PROFILE ================= */

export const getHodProfile = async (req, res) => {
  try {
    const hod = await User.findById(req.user._id)
      .populate("department", "name")
      .select("-password");

    if (!hod) {
      return res.status(404).json({ message: "HOD profile not found" });
    }

    res.json(hod);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= DASHBOARD ================= */

export const getHodDashboard = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized - No user found" });
    }

    const hod = await User.findById(req.user._id)
      .populate("department", "name");

    if (!hod) {
      return res.status(404).json({ message: "HOD profile not found" });
    }

    if (!hod.department) {
      return res.status(400).json({ message: "HOD department not found" });
    }

    const semester = await Semester.findOne({ active: true });

    const dept = hod.department._id;

    const sp = parseInt(req.query.sp) || 1;
    const stp = parseInt(req.query.stp) || 1;
    const shp = parseInt(req.query.shp) || 1;
    const sthp = parseInt(req.query.sthp) || 1;

    /* ---------- STUDENT REQUESTS ---------- */

    const studentQuery = {
      department: dept,
      semester: semester?._id,
      student: { $exists: true },
      status: "Pending-HOD",
    };

    const studentLeaves = await Leave.find(studentQuery)
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .skip((sp - 1) * LIMIT)
      .limit(LIMIT);

    const studentCount = await Leave.countDocuments(studentQuery);

    /* ---------- STAFF REQUESTS ---------- */

    const staffQuery = {
      department: dept,
      semester: semester?._id,
      staff: { $exists: true },
      status: "Pending-HOD",
    };

    const staffLeaves = await Leave.find(staffQuery)
      .populate("staff", "name")
      .sort({ createdAt: -1 })
      .skip((stp - 1) * LIMIT)
      .limit(LIMIT);

    const staffCount = await Leave.countDocuments(staffQuery);

    /* ---------- STUDENT HISTORY ---------- */

    const studentHistoryQuery = {
      department: dept,
      student: { $exists: true },
      status: { $ne: "Pending-HOD" },
    };

    const studentHistory = await Leave.find(studentHistoryQuery)
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .skip((shp - 1) * LIMIT)
      .limit(LIMIT);

    const studentHistoryCount =
      await Leave.countDocuments(studentHistoryQuery);

    /* ---------- STAFF HISTORY ---------- */

    const staffHistoryQuery = {
      department: dept,
      staff: { $exists: true },
      status: { $ne: "Pending-HOD" },
    };

    const staffHistory = await Leave.find(staffHistoryQuery)
      .populate("staff", "name")
      .sort({ createdAt: -1 })
      .skip((sthp - 1) * LIMIT)
      .limit(LIMIT);

    const staffHistoryCount =
      await Leave.countDocuments(staffHistoryQuery);

    /* ---------- RESPONSE ---------- */

    res.json({
      hod: {
        name: hod.name,
        department: hod.department,
      },
      semester, // ✅ send semester
      studentLeaves,
      staffLeaves,
      studentHistory,
      staffHistory,
      pagination: {
        studentReq: { page: sp, total: Math.ceil(studentCount / LIMIT) },
        staffReq: { page: stp, total: Math.ceil(staffCount / LIMIT) },
        studentHis: { page: shp, total: Math.ceil(studentHistoryCount / LIMIT) },
        staffHis: { page: sthp, total: Math.ceil(staffHistoryCount / LIMIT) },
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Dashboard error" });
  }
};

/* ================= APPROVE ================= */

export const approveLeave = async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await Leave.findById(req.params.leaveId)
      .populate("student", "name email department year")
      .populate("staff", "name email")
      .populate("department", "name");

    if (!leave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    if (leave.status !== "Pending-HOD") {
      return res.status(400).json({ message: "Leave not pending HOD approval" });
    }

    // HOD can approve or reject
    if (status === "Approved-HOD") {
      leave.status = "Approved-HOD";
    } else if (status === "Rejected-HOD") {
      leave.status = "Rejected-HOD";
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    leave.reviewedByHod = req.user._id;
    await leave.save();

    // ✅ SEND EMAIL TO STUDENT if approved
    if (leave.student && leave.student.email && status === "Approved-HOD") {
      try {
        const message = buildLeaveMessage({
          name: leave.student.name,
          role: "Student",
          department: leave.department?.name || "Unknown",
          year: leave.student.year,
          status: "Approved",
          reason: leave.reason,
          fromDate: leave.fromDate,
          toDate: leave.toDate,
        });

        await sendEmail(
          leave.student.email,
          "✅ Your Leave Request Approved",
          message
        );
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
        // Don't fail the request if email fails
      }
    }

    // ✅ SEND EMAIL TO STUDENT if rejected
    if (leave.student && leave.student.email && status === "Rejected-HOD") {
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
        // Don't fail the request if email fails
      }
    }

    // ✅ SEND EMAIL TO STAFF if approved
    if (leave.staff && leave.staff.email && status === "Approved-HOD") {
      try {
        const message = buildLeaveMessage({
          name: leave.staff.name,
          role: "Staff",
          department: leave.department?.name || "Unknown",
          status: "Approved",
          reason: leave.reason,
          fromDate: leave.fromDate,
          toDate: leave.toDate,
        });

        await sendEmail(
          leave.staff.email,
          "✅ Your Leave Request Approved",
          message
        );
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
        // Don't fail the request if email fails
      }
    }

    // ✅ SEND EMAIL TO STAFF if rejected
    if (leave.staff && leave.staff.email && status === "Rejected-HOD") {
      try {
        const message = buildLeaveMessage({
          name: leave.staff.name,
          role: "Staff",
          department: leave.department?.name || "Unknown",
          status: "Rejected",
          reason: leave.reason,
          fromDate: leave.fromDate,
          toDate: leave.toDate,
        });

        await sendEmail(
          leave.staff.email,
          "❌ Your Leave Request Rejected",
          message
        );
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
        // Don't fail the request if email fails
      }
    }

    const recipient = leave.student ? "student" : "staff";
    res.json({ 
      message: status === "Approved-HOD" 
        ? `Leave approved and email sent to ${recipient}` 
        : `Leave rejected and email sent to ${recipient}`,
      leave 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
