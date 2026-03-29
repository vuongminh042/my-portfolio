import { Router } from 'express';
import User from '../models/User.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = Router();

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
      });
    }
    res.json({
      name: admin.name,
      title: admin.title,
      bio: admin.bio,
      avatar: admin.avatar,
      facebook: admin.facebook,
      tiktok: admin.tiktok,
    });
  } catch (e) {
    next(e);
  }
});

router.patch('/', authRequired, adminOnly, async (req, res, next) => {
  try {
    const allowed = ['name', 'title', 'bio', 'facebook', 'tiktok', 'avatar'];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
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
    });
  } catch (e) {
    next(e);
  }
});

export default router;
