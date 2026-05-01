/* global process */
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await User.findOne({ role: "admin" });
    if (exists) {
      console.log("❌ Admin already exists");
      process.exit(0);
    }

    await User.create({
      name: "Super Admin",
      userId: "admin",
      email: "admin@college.com",
      password: "admin123",
      role: "admin",
      approved: true, // ✅ correct field
    });

    console.log("✅ Admin created successfully");
    process.exit(0);
  } catch (err) {
    console.error("Admin seed error:", err);
    process.exit(1);
  }
};

createAdmin();
