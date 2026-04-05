import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }
    const hash = await bcrypt.hash(password, 12);
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const isFirst = (await User.countDocuments()) === 0;
    const role =
      isFirst || (adminEmail && email.toLowerCase() === adminEmail) ? 'admin' : 'user';

    const user = await User.create({
      email: email.toLowerCase(),
      password: hash,
      name: name || '',
      role,
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('admin:updated', { type: 'users' });
    }

    const token = signToken(user);
    res.status(201).json({
      token,
      user: {
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
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
    }
    const token = signToken(user);
    res.json({
      token,
      user: {
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
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy user' });
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
