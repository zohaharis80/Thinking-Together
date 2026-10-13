import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    accent: { type: String, default: "violet" },
    progressState: {
      type: String,
      enum: ["on-track", "needs-attention", "ready"],
      default: "on-track",
    },
  },
  { timestamps: true },
);
export default mongoose.model("Group", schema);
