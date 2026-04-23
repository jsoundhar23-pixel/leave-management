import mongoose from "mongoose";
import User from "./models/User.js";
import Leave from "./models/Leave.js";

const MONGO_URI = "mongodb://127.0.0.1:27017/leaveDB";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    
    // Find Pending-HOD leaves with student info
    const leaves = await Leave.find({ status: "Pending-HOD" })
      .populate("student", "name email")
      .limit(5);

    console.log("\n📋 Checking student data in Pending-HOD leaves:\n");
    
    leaves.forEach((leave, i) => {
      console.log(`Leave ${i + 1}:`);
      console.log("  Student:", leave.student);
      console.log("  Student Email:", leave.student?.email);
      console.log("  ---");
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
