import dotenv from "dotenv";
import mongoose from "mongoose";
import Leave from "./models/Leave.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected");

  try {
    const leaves = await Leave.find({ status: "Pending-HOD" }).limit(3);
    
    console.log("Sample Pending-HOD leaves:");
    leaves.forEach(l => {
      console.log({
        _id: l._id,
        student: l.student,
        department: l.department,
        departmentType: typeof l.department,
        departmentIsNull: l.department === null,
        departmentIsUndef: l.department === undefined,
      });
    });

    // Try to update one with a proper ObjectId
    if (leaves.length > 0) {
      const firstLeave = leaves[0];
      console.log(`\nAttempting to set department for leave ${firstLeave._id}`);
      firstLeave.department = new mongoose.Types.ObjectId("6989bdb52c9f98761b2a7965"); // IT department
      await firstLeave.save();
      console.log("✅ Successfully saved");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
});
