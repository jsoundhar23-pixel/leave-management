import mongoose from "mongoose";

const semesterSchema = new mongoose.Schema(
  {
    name: String,
    startDate: Date,
    endDate: Date,
    maxLeaveDays: {
      type: Number,
      default: 20,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  
);

export default mongoose.model("Semester", semesterSchema);
