/* global process */
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const exists = await User.findOne({ role: "admin" });
    if (exists) {
      console.log("❌ Admin already exists");
      process.exit();
    }

    await User.create({
      name: "Admin",
      userId: "admin001",
      email: "admin@college.com",
      password: "admin123",
      role: "admin",
      approved: true,
    });

    console.log("✅ Admin created successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

createAdmin();
