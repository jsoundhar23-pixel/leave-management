import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
{
  role: {
    type: String,
    enum: ["student", "staff", "hod", "admin"],
    required: true,
    lowercase: true,
  },

  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  phone: {
    type: String,
    default: "",
  },

  // Reference to Department
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: function () {
      return this.role !== "admin";
    },
    default: null,
  },

  year: {
    type: String,
    enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "NA"],
    default: "NA",
    required: function () {
      return this.role === "student" || this.role === "staff";
    },
  },

  approved: {
    type: Boolean,
    default: function () {
      return this.role === "student" || this.role === "admin";
    },
  },
},
{ timestamps: true }
);

// HASH PASSWORD ONLY HERE
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model("User", userSchema);