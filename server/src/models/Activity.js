import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    classroomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    title: { type: String, required: true },
    problem: { type: String, required: true },
    instructions: String,
    status: {
      type: String,
      enum: ["draft", "live", "paused", "completed"],
      default: "draft",
    },
    phase: {
      type: String,
      enum: ["diverge", "discuss", "refine", "converge", "submit"],
      default: "diverge",
    },
    deadline: Date,
    settings: {
      allowVoting: { type: Boolean, default: true },
      anonymousIdeas: { type: Boolean, default: false },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model("Activity", schema);
