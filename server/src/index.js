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
const CLIENT_URL = process.env.CLIENT_URL?.trim();
const allowedOrigins = CLIENT_URL
  ? CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;

app.use(
  cors({
    origin: allowedOrigins,
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
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Lỗi máy chủ',
  });
});

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  socket.on('disconnect', () => { });
});

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('Thiếu MONGODB_URI trong .env');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Thiếu JWT_SECRET trong .env');
  process.exit(1);
}

const connectMongo = async () => {
  try {
    await mongoose.connect(uri);
    const dbName = mongoose.connection.name || '?';
    console.log(`MongoDB: đã kết nối (database: ${dbName})`);

  } catch (e) {
    console.error('Sẽ thử kết nối lại sau 10 giây...');
    setTimeout(connectMongo, 10_000);
  }
};

server.listen(PORT, () => {
  console.log(`🚀 App chạy tại: http://localhost:${PORT}`);
  connectMongo();
});