import dotenv from "dotenv";
import mongoose from "mongoose";
import Leave from "./models/Leave.js";
import Department from "./models/Department.js";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected\n");

  try {
    // Get the department that leaves are in
    const leaveDept = await Department.findById("69511876a36bfa3b6e5ef228");
    console.log("Leave Department:", { _id: leaveDept._id, name: leaveDept.name, code: leaveDept.code });

    // Get all departments
    const allDepts = await Department.find();
    console.log("\nAll Departments:");
    allDepts.forEach(d => {
      console.log(`  ${d.code}: ${d.name} (${d._id})`);
    });

    // Get HOD  and their department
    const hod = await User.findOne({ role: "hod" }).populate("department");
    console.log("\nHOD Info:");
    console.log({
      name: hod.name,
      userId: hod.userId,
      departmentId: hod.department?._id,
      departmentName: hod.department?.name,
      departmentCode: hod.department?.code,
    });

    // Check if they match
    const match = hod.department?._id.toString() === "69511876a36bfa3b6e5ef228";
    console.log(`\nDepartments Match: ${match}`);

    if (!match) {
      console.log("\n⚠️  HOD is in different department. Reassigning HOD to leave department...");
      hod.department = new mongoose.Types.ObjectId("69511876a36bfa3b6e5ef228");
      await hod.save();
      console.log("✅ HOD department updated");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
});
