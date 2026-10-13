import jwt from "jsonwebtoken";
import User from "../models/User.js";
export async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token)
      return res.status(401).json({ message: "Authentication required" });
    const p = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(p.id).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
export function role(...roles) {
  return (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res
          .status(403)
          .json({ message: "You do not have permission for this action" });
}
