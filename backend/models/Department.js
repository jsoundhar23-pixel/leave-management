import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    /* ===== NAME ===== */
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // prevent duplicate "IT"
      minlength: 2,
    },

    /* ===== CODE ===== */
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10,
    },

    /* ===== ADVISOR STAFF ===== */
    advisorStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ===== HOD ===== */
    hod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,          // createdAt, updatedAt
    versionKey: false,         // remove __v
  }
);

/* ===== PRE SAVE CLEAN ===== */
departmentSchema.pre("save", function (next) {
  if (this.name) this.name = this.name.trim();
  if (this.code) this.code = this.code.trim().toUpperCase();
  next();
});

export default mongoose.model("Department", departmentSchema);
