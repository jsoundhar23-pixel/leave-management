import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import Department from "./models/Department.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected");

  try {
    // Get all departments
    const depts = await Department.find();
    console.log(`Found ${depts.length} departments\n`);

    // Fix HODs without department
    const hods = await User.find({ role: "hod" });
    console.log(`Processing ${hods.length} HODs...`);
    for (const hod of hods) {
      if (!hod.department) {
        // Assign first available department
        hod.department = depts[0]._id;
        await hod.save();
        console.log(`✅ Assigned ${depts[0].name} to HOD ${hod.name}`);
      }
    }

    // Fix Students without department
    const students = await User.find({ role: "student" });
    console.log(`\nProcessing ${students.length} students...`);
    for (const student of students) {
      if (!student.department) {
        // Assign IT department to all
        student.department = depts[0]._id;
        await student.save();
        console.log(`✅ Assigned ${depts[0].name} to student ${student.name || student.userId}`);
      }
    }

    // Fix Staff without department
    const staff = await User.find({ role: "staff" });
    console.log(`\nProcessing ${staff.length} staff...`);
    for (const s of staff) {
      if (!s.department) {
        s.department = depts[0]._id;
        await s.save();
        console.log(`✅ Assigned ${depts[0].name} to staff ${s.name || s.userId}`);
      }
    }

    console.log("\n✅ All users now have departments assigned!");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
});
