import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import Department from "./models/Department.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected");

  try {
    // Find all HODs
    const hods = await User.find({ role: "hod" });
    console.log(`Found ${hods.length} HODs`);

    // Get all departments
    const depts = await Department.find();
    console.log(`Found ${depts.length} departments:`, depts.map(d => ({ code: d.code, name: d.name, _id: d._id })));

    // For each HOD without a department, assign one
    for (const hod of hods) {
      if (!hod.department) {
        // Find a department for this HOD (you can customize this logic)
        // For now, assign the first department or based on naming convention
        let dept = depts[0];
        
        // If HOD has a name suggesting a department, find matching one
        const hodNameLower = hod.name.toLowerCase();
        const matchingDept = depts.find(d => 
          hodNameLower.includes(d.code.toLowerCase()) || 
          hodNameLower.includes(d.name.toLowerCase())
        );
        
        if (matchingDept) {
          dept = matchingDept;
        }

        hod.department = dept._id;
        await hod.save();
        console.log(`✅ Assigned department ${dept.code} to HOD ${hod.name}`);
      } else {
        console.log(`✓ HOD ${hod.name} already has department assigned`);
      }
    }

    console.log("✅ All HODs processed");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
});
