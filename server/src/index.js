import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import Activity from "./models/Activity.js";
import Classroom from "./models/Classroom.js";
import authRoutes from "./routes/auth.js";
import classroomRoutes from "./routes/classrooms.js";
import activityRoutes from "./routes/activities.js";

const app = express();
const server = http.createServer(app);

// Environment configuration
const allowedOrigin =
  process.env.CLIENT_URL || "http://localhost:5173";

const port = process.env.PORT || 5000;

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

app.set("io", io);

// Middleware
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: "1mb" }));

// Connect to MongoDB before handling API requests
app.use("/api", async (req, res, next) => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    next();
  } catch (error) {
    console.error("Database connection failed:", error.message);

    res.status(503).json({
      message: "Database connection unavailable",
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    name: "Thinking Together API",
    time: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/activities", activityRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || "Unexpected server error",
  });
});

// Socket authentication
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    next(new Error("Invalid session"));
  }
});

// Socket connections and activity rooms
io.on("connection", (socket) => {
  socket.on("activity:join", async (id) => {
    try {
      const activity = await Activity.findById(id);

      if (!activity) {
        return socket.emit("realtime:error", {
          message: "Activity not found",
        });
      }

      const classroom = await Classroom.findById(
        activity.classroomId
      ).select("instructorId members");

      const userId = String(socket.user.id);

      const allowed =
        socket.user.role === "instructor"
          ? String(classroom?.instructorId) === userId
          : classroom?.members?.some(
              (member) => String(member) === userId
            );

      if (!allowed) {
        return socket.emit("realtime:error", {
          message: "You are not a member of this classroom",
        });
      }

      socket.join(`activity:${id}`);

      socket.emit("realtime:ready", {
        activityId: id,
      });
    } catch (error) {
      console.error("Activity join error:", error.message);

      socket.emit("realtime:error", {
        message: "Could not join activity",
      });
    }
  });

  socket.on("activity:leave", (id) => {
    socket.leave(`activity:${id}`);
  });
});

// Local development server
async function start() {
  if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
    throw new Error("Missing required environment variables");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log("MongoDB connected successfully");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Thinking Together API running on port ${port}`);
  });
}

// Run HTTP server locally, not inside Vercel Functions
if (!process.env.VERCEL) {
  start().catch((error) => {
    console.error("Startup failed:", error.message);
    process.exit(1);
  });
}

// Export Express app for Vercel
export default app;