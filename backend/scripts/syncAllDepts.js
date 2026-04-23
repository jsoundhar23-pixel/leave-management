import dotenv from "dotenv";
import mongoose from "mongoose";
import Leave from "./models/Leave.js";
import Department from "./models/Department.js";
import User from "./models/User.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected\n");

  try {
    // Get all departments
    const allDepts = await Department.find();
    console.log("All Departments:");
    allDepts.forEach(d => {
      console.log(`  ${d.code}: ${d.name} (${d._id})`);
    });

    // Get one Pending-HOD leave to see its department
    const sampleLeave = await Leave.findOne({ status: "Pending-HOD" });
    if (sampleLeave) {
      console.log(`\nSample Leave Department ID: ${sampleLeave.department}`);
      const leaveDept = allDepts.find(d => d._id.toString() === sampleLeave.department.toString());
      if (leaveDept) {
        console.log(`Leave is from: ${leaveDept.code} - ${leaveDept.name}`);
      } else {
        console.log("ERROR: Department ID in leave doesn't exist in departments!");
        console.log("Assigning all leaves to first department...");
        
        // Fix all leaves to use first department
        const firstDept = allDepts[0];
        const result = await Leave.updateMany(
          {},
          { $set: { department: firstDept._id } }
        );
        console.log(`✅ Updated ${result.modifiedCount} leaves`);
      }
    }

    // Get HOD and their department
    const hods = await User.find({ role: "hod" }).populate("department");
    console.log(`\nFound ${hods.length} HODs:`);
    hods.forEach(hod => {
      console.log(`  ${hod.name}: dept=${hod.department ? hod.department.code : 'NONE'}`);
    });

    // Assign all HODs to the first department
    console.log(`\nAssigning all HODs to ${allDepts[0].code}...`);
    for (const hod of hods) {
      hod.department = allDepts[0]._id;
      await hod.save();
      console.log(`✅ ${hod.name} → ${allDepts[0].code}`);
    }

    // Update all students to first department
    const students = await User.find({ role: "student" });
    console.log(`\nAssigning all ${students.length} students to ${allDepts[0].code}...`);
    const studentResult = await User.updateMany(
      { role: "student" },
      { $set: { department: allDepts[0]._id } }
    );
    console.log(`✅ Updated ${studentResult.modifiedCount} students`);

    // Update all staff to first department
    const staffResult = await User.updateMany(
      { role: "staff" },
      { $set: { department: allDepts[0]._id } }
    );
    console.log(`✅ Updated ${staffResult.modifiedCount} staff`);

    // Update all leaves to first department
    const leaveResult = await Leave.updateMany(
      {},
      { $set: { department: allDepts[0]._id } }
    );
    console.log(`✅ Updated ${leaveResult.modifiedCount} leaves`);

    console.log("\n✅ All departments synchronized!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
});
