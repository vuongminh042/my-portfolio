import { Router } from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authRequired, adminOnly, optionalAuth } from '../middleware/auth.js';

const router = Router();

function emitAdminMessageUpdate(io) {
  io.to('admins').emit('admin:updated', { type: 'messages' });
}

function emitUserMessageUpdate(io, userId, payload = {}) {
  if (!userId) return;
  io.to(`user:${userId.toString()}`).emit('user:messages', payload);
}

router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { name, email, subject, body } = req.body;
    if (!name || !email || !body) {
      return res.status(400).json({ message: 'Tên, email và nội dung là bắt buộc' });
    }

    let linkedUser = null;
    if (req.userId) {
      linkedUser = await User.findById(req.userId).select('name email');
    }

    const messageName = linkedUser?.name || name;
    const messageEmail = linkedUser?.email || email;

    const m = await Message.create({
      user: linkedUser?._id || null,
      name: messageName,
      email: messageEmail,
      subject: subject || '',
      body,
    });

    const io = req.app.get('io');
    if (io) {
      emitAdminMessageUpdate(io);
      emitUserMessageUpdate(io, linkedUser?._id, {
        type: 'submitted',
        messageId: m._id.toString(),
      });
    }

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

router.get('/mine/summary', authRequired, async (req, res, next) => {
  try {
    const [total, unreadReplies] = await Promise.all([
      Message.countDocuments({ user: req.userId }),
      Message.countDocuments({
        user: req.userId,
        'reply.body': { $exists: true, $ne: '' },
        'reply.readByUser': false,
      }),
    ]);

    res.json({ total, unreadReplies });
  } catch (e) {
    next(e);
  }
});

router.get('/mine', authRequired, async (req, res, next) => {
  try {
    const list = await Message.find({ user: req.userId }).sort({ createdAt: -1 });
    const unreadReplies = list.filter(
      (item) => item.reply?.body && item.reply.readByUser === false
    ).length;

    res.json({
      summary: {
        total: list.length,
        unreadReplies,
        waitingReplies: list.filter((item) => !item.reply?.body).length,
      },
      list,
    });
  } catch (e) {
    next(e);
  }
});

router.patch('/mine/read-replies', authRequired, async (req, res, next) => {
  try {
    await Message.updateMany(
      {
        user: req.userId,
        'reply.body': { $exists: true, $ne: '' },
        'reply.readByUser': false,
      },
      {
        $set: {
          'reply.readByUser': true,
        },
      }
    );

    const io = req.app.get('io');
    if (io) {
      emitUserMessageUpdate(io, req.userId, { type: 'replies-read' });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/reply', authRequired, adminOnly, async (req, res, next) => {
  try {
    const replyBody = req.body.body?.trim();
    if (!replyBody) {
      return res.status(400).json({ message: 'Nội dung phản hồi là bắt buộc' });
    }

    const admin = await User.findById(req.userId).select('name');
    const m = await Message.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
        reply: {
          body: replyBody,
          adminId: req.userId,
          adminName: admin?.name || 'Admin',
          respondedAt: new Date(),
          readByUser: false,
        },
      },
      { new: true }
    );
    if (!m) {
      return res.status(404).json({ message: 'Không tìm thấy' });
    }

    const io = req.app.get('io');
    if (io) {
      emitAdminMessageUpdate(io);
      emitUserMessageUpdate(io, m.user, {
        type: 'reply',
        messageId: m._id.toString(),
      });
    }

    res.json(m);
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

    const io = req.app.get('io');
    if (io) {
      emitAdminMessageUpdate(io);
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

    const io = req.app.get('io');
    if (io) {
      emitAdminMessageUpdate(io);
      emitUserMessageUpdate(io, m.user, {
        type: 'deleted',
        messageId: m._id.toString(),
      });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
