import dotenv from "dotenv";
import mongoose from "mongoose";
import Leave from "./models/Leave.js";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected");

  try {
    // Find all leaves without department
    const leavesWithoutDept = await Leave.find({ department: { $exists: false } })
      .populate("student", "_id department name");

    console.log(`Found ${leavesWithoutDept.length} leaves without department\n`);

    for (const leave of leavesWithoutDept) {
      if (leave.student && leave.student.department) {
        leave.department = leave.student.department;
        await leave.save();
        console.log(`✅ Assigned department to leave ${leave._id}`);
      }
    }

    // Also fix leaves where department is null
    const leavesWithNullDept = await Leave.find({ department: null })
      .populate("student", "_id department name");

    console.log(`\nFound ${leavesWithNullDept.length} leaves with null department\n`);

    for (const leave of leavesWithNullDept) {
      if (leave.student && leave.student.department) {
        leave.department = leave.student.department;
        await leave.save();
        console.log(`✅ Fixed null department for leave ${leave._id}`);
      }
    }

    console.log("\n✅ All leave records now have departments assigned!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
});
