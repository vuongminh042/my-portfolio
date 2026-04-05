import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import projectRoutes from "./routes/projects.js";
import skillRoutes from "./routes/skills.js";
import messageRoutes from "./routes/messages.js";
import adminRoutes from "./routes/admin.js";
import uploadRoutes from "./routes/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

function parseOriginList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      try {
        return new URL(item).origin;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...parseOriginList(process.env.CLIENT_URL),
  ...parseOriginList(process.env.CLIENT_ORIGINS),
  ...parseOriginList(process.env.CORS_ORIGINS),
  ...parseOriginList(process.env.RENDER_EXTERNAL_URL),
];
const originSet = new Set(allowedOrigins);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  try {
    return originSet.has(new URL(origin).origin);
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

const frontendPath = path.resolve(__dirname, "../../client/dist");
const frontendEntry = path.join(frontendPath, "index.html");
const hasFrontendBuild = fs.existsSync(frontendEntry);

if (hasFrontendBuild) {
  app.use(express.static(frontendPath));
}

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (!hasFrontendBuild) {
    return res.status(404).json({ message: "Frontend build not found" });
  }
  res.sendFile(frontendEntry);
});

app.use((err, _req, res, _next) => {
  console.error("🔥 Server error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Lỗi máy chủ",
  });
});

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = payload.sub;
      socket.data.userRole = payload.role;

      socket.join(`user:${payload.sub}`);
      if (payload.role === "admin") {
        socket.join("admins");
      }
    } catch (error) {
      console.warn("⚠️ Socket auth failed:", error.message);
    }
  }

  console.log("🔌 Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const uri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

if (!uri || !jwtSecret) {
  const missingVars = [
    !uri ? "MONGODB_URI" : null,
    !jwtSecret ? "JWT_SECRET" : null,
  ].filter(Boolean);
  console.error(`❌ Thiếu biến môi trường bắt buộc: ${missingVars.join(", ")}`);
  process.exit(1);
}

mongoose.set("bufferCommands", false);

mongoose.connection.on("connected", () => {
  console.log("✅ MongoDB connected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected");
});

async function startServer() {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server chạy tại: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Không kết nối được MongoDB:", err.message);
    process.exit(1);
  }
}

startServer();
