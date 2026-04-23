import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import Department from "./models/Department.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("MongoDB Connected");

  try {
    // Find user by email
    const user = await User.findOne({
      $or: [
        { email: "soundharjsoundhar76@gmail.com" },
        { userId: "soundharjsoundhar76@gmail.com" }
      ]
    }).populate("department");

    console.log("User found:", {
      _id: user?._id,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      department: user?.department,
      departmentId: user?.department?._id
    });

    if (user && !user.department) {
      console.log("\n⚠️  User has no department! Assigning IT department...");
      const dept = await Department.findOne({ code: "IT" });
      user.department = dept._id;
      await user.save();
      console.log("✅ Department assigned");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
});
