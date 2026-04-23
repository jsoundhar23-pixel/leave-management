import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },

    // ✅ TOTAL LEAVE DAYS
    totalDays: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Pending-Staff",
        "Approved-Staff",
        "Rejected-Staff",
        "Pending-HOD",
        "Approved-HOD",
        "Rejected-HOD",
      ],
      default: "Pending-Staff",
    },

    reviewedByStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedByHod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    semester: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Semester",
},

  },

  { timestamps: true }
);

// ✅ THIS LINE WAS MISSING
const Leave = mongoose.model("Leave", leaveSchema);

// ✅ DEFAULT EXPORT (IMPORTANT)
export default Leave;
