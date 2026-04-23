import "dotenv/config.js";
import mongoose from "mongoose";
import User from "./models/User.js";
import Leave from "./models/Leave.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/leaveDB";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    console.log("\n📋 Checking Staff Pending-HOD leaves:\n");

    const staffLeaves = await Leave.find({ 
      status: "Pending-HOD",
      staff: { $exists: true }
    })
      .populate("staff", "name email")
      .populate("student", "name email");

    console.log("✅ Found", staffLeaves.length, "staff leaves with Pending-HOD status\n");
    
    staffLeaves.forEach(leave => {
      console.log("Leave ID:", leave._id);
      console.log("  Staff:", leave.staff?.name, leave.staff?.email ? `<${leave.staff.email}>` : "(no email)");
      console.log("  Student:", leave.student?.name, leave.student?.email ? `<${leave.student.email}>` : "(no email)");
      console.log();
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
