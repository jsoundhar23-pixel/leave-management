/* global process */
import User from "../models/User.js";
import Department from "../models/Department.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";   // ✅ THIS WAS MISSING


export const signup = async (req, res) => {
  try {
    const { role, userId, name, email, password, phone, department, year } = req.body;

    if (!role || !userId || !name || !email || !password || !department) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if ((role === "student" || role === "staff") && !year) {
      return res.status(400).json({ message: "Year required" });
    }

    const exists = await User.findOne({ userId });
    if (exists) return res.status(400).json({ message: "User exists" });

    let phoneWithCode = "";
    if (phone) {
      if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({ message: "Invalid phone" });
      }
      phoneWithCode = "+91" + phone;
    }

    // Resolve department to ObjectId (accept either code or name)
    const deptDoc = await Department.findOne({
      $or: [{ code: department }, { name: department }],
    });

    if (!deptDoc && role !== "admin") {
      return res.status(400).json({ message: "Invalid department" });
    }

    // For non-student/staff roles, default year to "NA" if not provided or empty
    const finalYear = (role === "student" || role === "staff") ? year : "NA";

    const newUser = new User({
      role,
      userId,
      name,
      email,
      password,
      phone: phoneWithCode,
      department: deptDoc?._id || null,
      year: finalYear,
    });

    await newUser.save();

    res.json({ message: "Signup successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // ✅ FIRST fetch user
    const user = await User.findOne({
      $or: [{ userId: username }, { email: username }],
    }).populate("department", "name code");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ BLOCK only staff & hod if not approved
    if (
      (user.role === "staff" || user.role === "hod") &&
      user.approved !== true
    ) {
      return res.status(403).json({
        message: "Account pending admin approval",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      user: {
        id: user._id,
        name: user.name,
        department: user.department,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};
