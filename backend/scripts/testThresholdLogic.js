import "dotenv/config.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Department from "./models/Department.js";
import Leave from "./models/Leave.js";
import Semester from "./models/Semester.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/leaveDB";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    console.log("\n═══════════════════════════════════════════");
    console.log("  📊 TESTING LEAVE THRESHOLD LOGIC");
    console.log("═══════════════════════════════════════════\n");

    const semester = await Semester.findOne({ active: true });
    
    if (!semester) {
      console.log("❌ No active semester found!");
      process.exit(1);
    }

    console.log("📚 Active Semester:", semester.name);
    console.log("   Max Leave Days:", semester.maxLeaveDays, "\n");

    // Test Student Threshold (78%)
    console.log("🎓 STUDENT THRESHOLD TEST:");
    console.log("   78% of", semester.maxLeaveDays, "days =", Math.round(semester.maxLeaveDays * 0.78), "days");
    
    const studentsWithLeaves = await Leave.find()
      .populate("student", "name email")
      .distinct("student");
    
    if (studentsWithLeaves.length > 0) {
      const student = studentsWithLeaves[0];
      const studentLeaves = await Leave.find({ 
        student,
        status: { $ne: "Rejected-HOD" }
      });
      
      const totalStudentDays = studentLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
      const percentage = Math.round((totalStudentDays / semester.maxLeaveDays) * 100);
      
      console.log("   Sample student total leave:", totalStudentDays, "days");
      console.log("   Percentage used:", percentage, "%");
      if (percentage >= 78) {
        console.log("   ✅ WOULD TRIGGER 78% ALERT ✅\n");
      } else {
        console.log("   ❌ Below 78% threshold\n");
      }
    }

    // Test Staff Threshold (20 days)
    console.log("👔 STAFF THRESHOLD TEST:");
    console.log("   Maximum Leave Limit: 20 days\n");
    
    const staffWithLeaves = await Leave.find()
      .populate("staff", "name email")
      .distinct("staff");
    
    if (staffWithLeaves.length > 0) {
      const staff = staffWithLeaves[0];
      const staffLeaves = await Leave.find({ 
        staff,
        status: { $ne: "Rejected-HOD" }
      });
      
      const totalStaffDays = staffLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
      
      console.log("   Sample staff total leave:", totalStaffDays, "days");
      if (totalStaffDays >= 20) {
        console.log("   ✅ WOULD TRIGGER 20 DAYS ALERT ✅");
        console.log("   📧 Email would be sent to staff\n");
      } else {
        console.log("   ❌ Below 20 days threshold");
        console.log("   Days remaining:", 20 - totalStaffDays, "\n");
      }
    }

    console.log("═══════════════════════════════════════════");
    console.log("✅ Threshold logic test completed!");
    console.log("═══════════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
