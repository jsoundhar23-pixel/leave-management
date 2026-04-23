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
    
    // Find a Pending-HOD leave
    const leave = await Leave.findOne({ status: "Pending-HOD" })
      .populate("student", "name email year")
      .populate("department", "name");

    if (!leave) {
      console.log("❌ No Pending-HOD leaves found");
      process.exit(1);
    }

    console.log("📋 Found leave:", leave._id);
    console.log("Student:", leave.student?.name, "Email:", leave.student?.email);
    
    if (!leave.student?.email) {
      console.log("❌ No student email!");
      process.exit(1);
    }

    // Send email directly
    console.log("\n🧪 Testing email send...");
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

    console.log("📧 Sending email to:", leave.student.email);
    await sendEmail(
      leave.student.email,
      "✅ Your Leave Request Approved",
      message
    );
    
    console.log("✅ Email sent successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
