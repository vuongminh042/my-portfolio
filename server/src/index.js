import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import projectRoutes from './routes/projects.js';
import skillRoutes from './routes/skills.js';
import messageRoutes from './routes/messages.js';
import uploadRoutes from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'https://my-portfolio-8oh4.onrender.com',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));

const uploadsRoot = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsRoot));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const frontendCandidates = [
  path.join(__dirname, '../frontend/dist'),
  path.join(__dirname, '../../client/dist'),
];
const frontendPath = frontendCandidates.find((dir) => fs.existsSync(dir));

if (frontendPath) app.use(express.static(frontendPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  if (!frontendPath) {
    return res.status(404).json({ message: 'Frontend build not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('🔥 Server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Lỗi máy chủ',
  });
});


const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ Thiếu MONGODB_URI');
  process.exit(1);
}

mongoose.set('bufferCommands', false);

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
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
    console.error('❌ Không kết nối được MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();