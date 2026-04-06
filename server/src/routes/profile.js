import { Router } from 'express';
import User from '../models/User.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = Router();

function normalizeText(value) {
  return (typeof value === 'string' ? value : '').trim();
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;

  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  return fallback;
}

router.get('/public', async (_req, res, next) => {
  try {
    const admin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
    if (!admin) {
      return res.json({
        name: '',
        title: 'Frontend Developer',
        bio: '',
        avatar: '',
        facebook: '',
        tiktok: '',
        backgroundMusicEnabled: true,
      });
    }
    res.json({
      name: admin.name,
      title: admin.title,
      bio: admin.bio,
      avatar: admin.avatar,
      facebook: admin.facebook,
      tiktok: admin.tiktok,
      backgroundMusicEnabled: admin.backgroundMusicEnabled ?? true,
    });
  } catch (e) {
    next(e);
  }
});

router.patch('/', authRequired, adminOnly, async (req, res, next) => {
  try {
    const updates = {};
    const textFields = ['name', 'title', 'bio', 'facebook', 'tiktok', 'avatar'];

    for (const field of textFields) {
      if (req.body[field] !== undefined) {
        updates[field] = normalizeText(req.body[field]);
      }
    }

    if (req.body.backgroundMusicEnabled !== undefined) {
      updates.backgroundMusicEnabled = normalizeBoolean(req.body.backgroundMusicEnabled, true);
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('portfolio:updated', { type: 'profile' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      title: user.title,
      bio: user.bio,
      avatar: user.avatar,
      role: user.role,
      facebook: user.facebook,
      tiktok: user.tiktok,
      backgroundMusicEnabled: user.backgroundMusicEnabled,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
