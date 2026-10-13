import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    selectedIdeaIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Idea" }],
    finalText: String,
    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed"],
      default: "draft",
    },
    submittedAt: Date,
    grade: Number,
    feedback: String,
  },
  { timestamps: true },
);
export default mongoose.model("Submission", schema);
