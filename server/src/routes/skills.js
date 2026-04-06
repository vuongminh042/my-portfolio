import { Router } from 'express';
import Skill from '../models/Skill.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = Router();

function normalizeText(value) {
  return (typeof value === 'string' ? value : '').trim();
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pickSkillPayload(body = {}, allowPartial = false) {
  const payload = {};

  if (!allowPartial || body.name !== undefined) {
    payload.name = normalizeText(body.name);
  }
  if (!allowPartial || body.level !== undefined) {
    payload.level = normalizeNumber(body.level, 80);
  }
  if (!allowPartial || body.category !== undefined) {
    payload.category = normalizeText(body.category) || 'general';
  }
  if (!allowPartial || body.order !== undefined) {
    payload.order = normalizeNumber(body.order, 0);
  }

  return payload;
}

router.get('/', async (_req, res, next) => {
  try {
    const list = await Skill.find().sort({ order: 1, createdAt: -1 });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/', authRequired, adminOnly, async (req, res, next) => {
  try {
    const s = await Skill.create(pickSkillPayload(req.body));

    const io = req.app.get('io');
    if (io) {
      io.emit('portfolio:updated', { type: 'skills' });
    }

    res.status(201).json(s);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const s = await Skill.findByIdAndUpdate(req.params.id, pickSkillPayload(req.body, true), {
      new: true,
      runValidators: true,
    });
    if (!s) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('portfolio:updated', { type: 'skills' });
    }
    res.json(s);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const s = await Skill.findByIdAndDelete(req.params.id);
    if (!s) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('portfolio:updated', { type: 'skills' });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
