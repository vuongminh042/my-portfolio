import { Router } from 'express';
import Message from '../models/Message.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, email, subject, body } = req.body;
    if (!name || !email || !body) {
      return res.status(400).json({ message: 'Tên, email và nội dung là bắt buộc' });
    }
    const m = await Message.create({ name, email, subject: subject || '', body });
    res.status(201).json({ id: m._id, ok: true });
  } catch (e) {
    next(e);
  }
});

router.get('/', authRequired, adminOnly, async (_req, res, next) => {
  try {
    const list = await Message.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/read', authRequired, adminOnly, async (req, res, next) => {
  try {
    const m = await Message.findByIdAndUpdate(
      req.params.id,
      { read: req.body.read !== false },
      { new: true }
    );
    if (!m) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }
    res.json(m);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const m = await Message.findByIdAndDelete(req.params.id);
    if (!m) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
