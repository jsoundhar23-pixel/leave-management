/* global process */
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ================= AUTH ================= */
export const authMiddleware = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

/* ================= ROLE MIDDLEWARES ================= */
export const studentMiddleware = (req, res, next) => {
  if (req.user.role === "student") return next();
  return res.status(403).json({ message: "Student access only" });
};

export const staffMiddleware = (req, res, next) => {
  if (req.user.role === "staff") return next();
  return res.status(403).json({ message: "Staff access only" });
};

export const hodMiddleware = (req, res, next) => {
  if (req.user.role === "hod") return next();
  return res.status(403).json({ message: "HOD access only" });
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role === "admin") return next();
  return res.status(403).json({ message: "Admin access only" });
};
