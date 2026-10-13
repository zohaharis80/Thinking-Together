import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: String,
    title: String,
    message: String,
    read: { type: Boolean, default: false },
    relatedId: String,
  },
  { timestamps: true },
);
export default mongoose.model("Notification", schema);
