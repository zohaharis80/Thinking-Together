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
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    tags: [String],
    status: {
      type: String,
      enum: ["new", "promising", "selected", "merged", "archived"],
      default: "new",
    },
    parentIdeaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idea",
      default: null,
    },
    version: { type: Number, default: 1 },
  },
  { timestamps: true },
);
export default mongoose.model("Idea", schema);
