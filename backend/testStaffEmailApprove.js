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
    console.log("  📧 TESTING STAFF EMAIL ON HOD APPROVAL");
    console.log("═══════════════════════════════════════\n");

    // Find staff Pending-HOD leaves
    const staffLeave = await Leave.findOne({ 
      status: "Pending-HOD",
      staff: { $exists: true }
    })
      .populate("staff", "name email")
      .populate("department", "name");

    if (!staffLeave) {
      console.log("❌ No Pending-HOD staff leaves found!");
      process.exit(1);
    }

    console.log("📋 Found Staff Leave:", staffLeave._id);
    console.log("   Staff:", staffLeave.staff.name, `<${staffLeave.staff.email}>`);
    console.log("   Department:", staffLeave.department?.name);
    console.log("   Reason:", staffLeave.reason);
    console.log("\n🧪 Sending approval email to staff...\n");

    const message = buildLeaveMessage({
      name: staffLeave.staff.name,
      role: "Staff",
      department: staffLeave.department?.name || "Unknown",
      status: "Approved",
      reason: staffLeave.reason,
      fromDate: staffLeave.fromDate,
      toDate: staffLeave.toDate,
    });

    await sendEmail(
      staffLeave.staff.email,
      "✅ Your Leave Request Approved by HOD",
      message
    );

    console.log("✅ Email sent successfully to staff!\n");
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
