import { Router } from 'express';
import Project from '../models/Project.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const list = await Project.find().sort({ order: 1, createdAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', authRequired, adminOnly, async (req, res, next) => {
  try {
    const p = await Project.create(req.body);

    const io = req.app.get('io');
    if (io) {
      io.emit('portfolio:updated', { type: 'projects' });
    }

    res.status(201).json(p);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const p = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!p) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('portfolio:updated', { type: 'projects' });
    }
    res.json(p);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const p = await Project.findByIdAndDelete(req.params.id);
    if (!p) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('portfolio:updated', { type: 'projects' });
    }
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
