import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";
const r = Router();
const token = (u) =>
  jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
r.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "student" } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email already registered" });
    const u = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: role === "instructor" ? "instructor" : "student",
    });
    res
      .status(201)
      .json({
        token: token(u),
        user: { id: u._id, name: u.name, email: u.email, role: u.role },
      });
  } catch (e) {
    res.status(500).json({ message: "Registration failed" });
  }
});
r.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u || !(await bcrypt.compare(password, u.passwordHash)))
      return res.status(401).json({ message: "Incorrect email or password" });
    res.json({
      token: token(u),
      user: { id: u._id, name: u.name, email: u.email, role: u.role },
    });
  } catch (e) {
    res.status(500).json({ message: "Login failed" });
  }
});
r.get("/me", auth, (req, res) =>
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  }),
);
export default r;
