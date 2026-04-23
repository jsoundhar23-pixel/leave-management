import mongoose from "mongoose";
import Leave from "./models/Leave.js";
import User from "./models/User.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/leaveDB";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Find a Pending-HOD leave
    const leave = await Leave.findOne({ status: "Pending-HOD" })
      .populate("student", "name email")
      .populate("staff", "name email")
      .populate("department", "name");

    if (!leave) {
      console.log("❌ No Pending-HOD leaves found");
      process.exit(0);
    }

    console.log("\n📋 Leave Found:");
    console.log("ID:", leave._id);
    console.log("Student:", leave.student?.name, "Email:", leave.student?.email);
    console.log("Staff:", leave.staff?.name, "Email:", leave.staff?.email);
    console.log("Status:", leave.status);
    console.log("Department:", leave.department?.name);

    if (!leave.student?.email) {
      console.log("❌ Student email is missing!");
      process.exit(1);
    }

    console.log("\n🧪 Testing HOD approval (should send emails)...");
    
    // Simulate HOD approval
    const hodUser = await User.findOne({ role: "HOD" });
    leave.status = "Approved-HOD";
    leave.reviewedByHod = hodUser._id;
    await leave.save();

    console.log("✅ Leave updated to Approved-HOD");
    console.log("📧 Email should be sent to:", leave.student.email);
    console.log("   (Check email logs in server console)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
