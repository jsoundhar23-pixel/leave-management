/* global process */
import mongoose from "mongoose";
import dotenv from "dotenv";
import Department from "./models/Department.js";

dotenv.config();

const departments = [
  { name: "Information Technology", code: "IT" },
  { name: "Computer Science", code: "CSE" },
  { name: "Electrical Engineering", code: "EEE" },
  { name: "Electronics & Communication", code: "ECE" },
  { name: "Civil Engineering", code: "CIVIL" },
  { name: "Mechanical Engineering", code: "MECH" },
];

const seedDepartments = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await Department.deleteMany({}); // 👈 IMPORTANT

  await Department.insertMany(departments);

  console.log("✅ Departments seeded");
  await mongoose.disconnect();
};

seedDepartments();
