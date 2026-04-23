import dotenv from "dotenv";
import mongoose from "mongoose";
import Leave from "./models/Leave.js";
import Semester from "./models/Semester.js";
import User from "./models/User.js";
import Department from "./models/Department.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected\n");

  try {
    // Get active semester
    const semester = await Semester.findOne({ active: true });
    console.log("Active Semester:", {
      _id: semester?._id,
      name: semester?.name,
      startDate: semester?.startDate,
      endDate: semester?.endDate,
    });

    // Get all leaves with "Pending-HOD" status
    const pendingHodLeaves = await Leave.find({ status: "Pending-HOD" })
      .populate("student", "name email")
      .populate("staff", "name email")
      .populate("department", "name code")
      .populate("semester", "name");

    console.log(`\n📋 Found ${pendingHodLeaves.length} leaves with status "Pending-HOD":`);
    pendingHodLeaves.forEach(l => {
      console.log({
        _id: l._id,
        student: l.student?.name,
        staff: l.staff?.name,
        department: l.department?.name,
        semester: l.semester?.name,
        status: l.status,
        fromDate: l.fromDate,
        toDate: l.toDate,
        totalDays: l.totalDays,
      });
    });

    // Get ALL leaves to see their statuses
    const allLeaves = await Leave.find()
      .populate("student", "name")
      .populate("staff", "name")
      .populate("department", "name")
      .select("student staff department status semester fromDate toDate");

    console.log(`\n📊 ALL Leaves by Status:`);
    const statuses = {};
    allLeaves.forEach(l => {
      if (!statuses[l.status]) statuses[l.status] = [];
      statuses[l.status].push({
        student: l.student?.name,
        staff: l.staff?.name,
        department: l.department?.name,
        fromDate: l.fromDate.toLocaleDateString("en-IN"),
        toDate: l.toDate.toLocaleDateString("en-IN"),
      });
    });

    Object.keys(statuses).forEach(status => {
      console.log(`\n${status}: ${statuses[status].length} leaves`);
      statuses[status].forEach(l => {
        console.log(`  - ${l.student} (${l.department}): ${l.fromDate} to ${l.toDate}`);
      });
    });

    // Check HOD's department
    const hod = await User.findOne({ role: "hod" })
      .populate("department", "name code");
    
    console.log(`\n👤 HOD Info:`, {
      name: hod?.name,
      department: hod?.department?.name,
      departmentId: hod?.department?._id,
    });

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
});
