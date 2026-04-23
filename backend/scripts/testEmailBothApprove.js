import "dotenv/config.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Department from "./models/Department.js";
import Leave from "./models/Leave.js";
import { sendEmail } from "./utils/sendEmail.js";
import { buildLeaveMessage } from "./utils/leaveMessage.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/leaveDB";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    console.log("\n═══════════════════════════════════════");
    console.log("  📧 TESTING EMAIL FOR HOD APPROVAL");
    console.log("═══════════════════════════════════════\n");

    // Find Pending-HOD leaves (both student and staff)
    const pendingHodLeaves = await Leave.find({ status: "Pending-HOD" })
      .populate("student", "name email")
      .populate("staff", "name email")
      .populate("department", "name")
      .limit(2);

    if (pendingHodLeaves.length === 0) {
      console.log("❌ No Pending-HOD leaves found!");
      process.exit(1);
    }

    console.log(`✅ Found ${pendingHodLeaves.length} Pending-HOD leaves\n`);

    for (const leave of pendingHodLeaves) {
      console.log("📋 Leave ID:", leave._id);
      
      // Test sending email to student
      if (leave.student && leave.student.email) {
        console.log("  👤 Student:", leave.student.name, `<${leave.student.email}>`);
        try {
          const msg = buildLeaveMessage({
            name: leave.student.name,
            role: "Student",
            department: leave.department?.name || "Unknown",
            status: "Approved",
            reason: leave.reason,
            fromDate: leave.fromDate,
            toDate: leave.toDate,
          });
          await sendEmail(
            leave.student.email,
            "✅ Your Leave Request Approved by HOD",
            msg
          );
          console.log("     ✅ Email sent to student!");
        } catch (err) {
          console.log("     ❌ Error:", err.message);
        }
      }

      // Test sending email to staff
      if (leave.staff && leave.staff.email) {
        console.log("  👔 Staff:", leave.staff.name, `<${leave.staff.email}>`);
        try {
          const msg = buildLeaveMessage({
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
            "✅ Your Leave Request Approved by HOD",
            msg
          );
          console.log("     ✅ Email sent to staff!");
        } catch (err) {
          console.log("     ❌ Error:", err.message);
        }
      }
      
      console.log();
    }

    console.log("═══════════════════════════════════════");
    console.log("✅ Email test completed successfully!");
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
