import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { authRequired, adminOnly } from '../middleware/auth.js';
import User from '../models/User.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarsDir = path.join(__dirname, '..', '..', 'uploads', 'avatars');
const projectsDir = path.join(__dirname, '..', '..', 'uploads', 'projects');

for (const dir of [avatarsDir, projectsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function imageFilter(_req, file, cb) {
  if (/^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận ảnh JPEG, PNG, GIF, WebP'));
  }
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, safe);
  },
});

const projectStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, projectsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, safe);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadProject = multer({
  storage: projectStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const router = Router();

router.post('/avatar', authRequired, adminOnly, uploadAvatar.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file' });
    }
    const relative = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findById(req.userId);
    if (user?.avatar && user.avatar.startsWith('/uploads/avatars/')) {
      const oldName = path.basename(user.avatar);
      const oldPath = path.join(avatarsDir, oldName);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    user.avatar = relative;
    await user.save();
    const o = user.toObject();
    delete o.password;
    res.json({ avatar: relative, user: o });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/project',
  authRequired,
  adminOnly,
  uploadProject.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Không có file' });
      }
      const relative = `/uploads/projects/${req.file.filename}`;
      res.json({ image: relative });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
