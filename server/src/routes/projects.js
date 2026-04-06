import { Router } from 'express';
import Project from '../models/Project.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = Router();

function normalizeText(value) {
  return (typeof value === 'string' ? value : '').trim();
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;

  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  return fallback;
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickProjectPayload(body = {}, allowPartial = false) {
  const payload = {};

  if (!allowPartial || body.title !== undefined) {
    payload.title = normalizeText(body.title);
  }
  if (!allowPartial || body.description !== undefined) {
    payload.description = normalizeText(body.description);
  }
  if (!allowPartial || body.image !== undefined) {
    payload.image = normalizeText(body.image);
  }
  if (!allowPartial || body.tech !== undefined) {
    const rawTech = Array.isArray(body.tech) ? body.tech : body.tech !== undefined ? [body.tech] : [];
    payload.tech = rawTech.map(normalizeText).filter(Boolean);
  }
  if (!allowPartial || body.liveUrl !== undefined) {
    payload.liveUrl = normalizeText(body.liveUrl);
  }
  if (!allowPartial || body.repoUrl !== undefined) {
    payload.repoUrl = normalizeText(body.repoUrl);
  }
  if (!allowPartial || body.featured !== undefined) {
    payload.featured = normalizeBoolean(body.featured, false);
  }
  if (!allowPartial || body.order !== undefined) {
    payload.order = normalizeNumber(body.order, 0);
  }

  return payload;
}

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
    const p = await Project.create(pickProjectPayload(req.body));

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
    const p = await Project.findByIdAndUpdate(req.params.id, pickProjectPayload(req.body, true), {
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
