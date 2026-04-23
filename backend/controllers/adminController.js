import User from "../models/User.js";
import Department from "../models/Department.js";
import Semester from "../models/Semester.js";

const getNextYear = (year) => {
  switch (year) {
    case "1st Year":
      return "2nd Year";
    case "2nd Year":
      return "3rd Year";
    case "3rd Year":
      return "4th Year";
    default:
      return year;
  }
};

const isEvenSemester = (name = "") => {
  const n = (name || "").toLowerCase().trim();
  if (!n) return false;

  // Explicit keywords
  if (n.includes("even")) return true;
  if (n.includes("odd")) return false;

  // Fall back to checking for a numeric semester number
  const match = n.match(/\b(\d+)\b/);
  if (!match) return false;

  const semNum = parseInt(match[1], 10);
  return semNum % 2 === 0;
};

/* ================= USERS ================= */

export const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.approved = true;
    await user.save();

    res.json({ message: "User approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Approval failed" });
  }
};

export const rejectUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ message: "User rejected" });
};

/* 🔥 MAIN FIX HERE */
export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      approved: false,
      role: { $in: ["staff", "hod"] }, // IMPORTANT
    }).select("name role email");

    res.json(users);
  } catch {
    res.status(500).json({ message: "Failed" });
  }
};

export const getStaff = async (req, res) => {
  const staff = await User.find({ role: "staff", approved: true });
  res.json(staff);
};

export const getHods = async (req, res) => {
  const hods = await User.find({ role: "hod", approved: true });
  res.json(hods);
};

/* ================= DEPARTMENT ================= */

export const getDepartments = async (req, res) => {
  const depts = await Department.find()
    .populate("advisorStaff", "name")
    .populate("hod", "name");
  res.json(depts);
};

export const addDepartment = async (req, res) => {
  const dept = await Department.create({ name: req.body.name });
  res.json(dept);
};

export const deleteDepartment = async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

export const assignAdvisor = async (req, res) => {
  const { staffId } = req.body;

  await Department.findByIdAndUpdate(req.params.id, {
    advisorStaff: staffId,
  });

  await User.findByIdAndUpdate(staffId, {
    department: req.params.id,
  });

  res.json({ message: "Advisor assigned" });
};

export const assignHod = async (req, res) => {
  const { hodId } = req.body;

  await Department.findByIdAndUpdate(req.params.id, {
    hod: hodId,
  });

  await User.findByIdAndUpdate(hodId, {
    department: req.params.id,
  });

  res.json({ message: "HOD assigned" });
};

/* ================= SEMESTER ================= */

export const createSemester = async (req, res) => {
  try {
    const { name, startDate, endDate, maxLeaveDays } = req.body;

    // Only one active semester is allowed at a time.
    const active = await Semester.findOne({ active: true });
    if (active) {
      return res
        .status(400)
        .json({ message: "An active semester already exists. Finish it before creating a new one." });
    }

    const semester = await Semester.create({
      name,
      startDate,
      endDate,
      maxLeaveDays,
      active: true,
    });

    // If this is an "even" semester, move students to the next academic year
    if (isEvenSemester(name)) {
      const years = ["1st Year", "2nd Year", "3rd Year"];
      await Promise.all(
        years.map((year) => {
          const nextYear = getNextYear(year);
          return User.updateMany({ role: "student", year }, { year: nextYear });
        })
      );
    }

    res.json({ message: "Semester created", semester });
  } catch {
    res.status(500).json({ message: "Failed" });
  }
};

export const updateSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const semester = await Semester.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!semester) return res.status(404).json({ message: "Semester not found" });

    res.json({ message: "Semester updated", semester });
  } catch {
    res.status(500).json({ message: "Failed" });
  }
};

export const deleteSemester = async (req, res) => {
  try {
    const { id } = req.params;
    const semester = await Semester.findByIdAndDelete(id);
    if (!semester) return res.status(404).json({ message: "Semester not found" });

    res.json({ message: "Semester deleted" });
  } catch {
    res.status(500).json({ message: "Failed" });
  }
};

export const getActiveSemester = async (req, res) => {
  const semester = await Semester.findOne({ active: true });
  res.json(semester);
};
