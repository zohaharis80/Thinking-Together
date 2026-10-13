import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["instructor", "student"], default: "student" },
    avatar: { type: String, default: "" },
  },
  { timestamps: true },
);
export default mongoose.model("User", schema);
