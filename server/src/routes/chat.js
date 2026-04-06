import { Router } from 'express';
import ChatMessage from '../models/ChatMessage.js';
import ChatThread from '../models/ChatThread.js';
import User from '../models/User.js';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { emitChatUpdate, getUserRoom, roomHasConnections } from '../lib/chatRealtime.js';

const router = Router();

async function ensureMemberUser(userId) {
  const user = await User.findById(userId).select('name email role title');
  if (!user) return null;
  if (user.role !== 'user') return null;
  return user;
}

async function ensureThreadForUser(user) {
  return ChatThread.findOneAndUpdate(
    { user: user._id },
    {
      $setOnInsert: {
        user: user._id,
        title: 'Trao đổi hỗ trợ',
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

async function cleanupOrphanThreads(io) {
  const threads = await ChatThread.find().select('_id user').lean();
  if (!threads.length) return;

  const userIds = [...new Set(threads.map((thread) => thread.user?.toString()).filter(Boolean))];
  if (!userIds.length) return;

  const existingUsers = await User.find({
    _id: { $in: userIds },
  })
    .select('_id')
    .lean();

  const existingUserIds = new Set(existingUsers.map((user) => user._id.toString()));
  const orphanThreads = threads.filter((thread) => !existingUserIds.has(thread.user.toString()));

  if (!orphanThreads.length) return;

  const orphanThreadIds = orphanThreads.map((thread) => thread._id);

  await ChatMessage.deleteMany({
    thread: { $in: orphanThreadIds },
  });
  await ChatThread.deleteMany({
    _id: { $in: orphanThreadIds },
  });

  orphanThreads.forEach((thread) => {
    emitChatUpdate(io, {
      threadId: thread._id,
      userId: thread.user,
      payload: {
        type: 'deleted',
        deleted: true,
      },
    });
  });
}

function formatThread(thread, user) {
  return {
    _id: thread._id,
    title: thread.title,
    status: thread.status,
    lastMessage: thread.lastMessage,
    lastMessageAt: thread.lastMessageAt,
    lastSenderRole: thread.lastSenderRole,
    userUnreadCount: thread.userUnreadCount,
    adminUnreadCount: thread.adminUnreadCount,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    user: user
      ? {
          _id: user._id,
          name: user.name || '',
          email: user.email || '',
          title: user.title || '',
          role: user.role,
        }
      : null,
  };
}

async function getThreadMessageCountMap(threadIds) {
  if (!threadIds.length) return new Map();

  const totals = await ChatMessage.aggregate([
    {
      $match: {
        thread: { $in: threadIds },
      },
    },
    {
      $group: {
        _id: '$thread',
        totalMessages: { $sum: 1 },
      },
    },
  ]);

  return new Map(
    totals.map((item) => [item._id.toString(), item.totalMessages])
  );
}

async function deleteThreadConversation(thread, io) {
  const threadId = thread._id;
  const userId = thread.user?._id || thread.user;

  const deletedMessages = await ChatMessage.deleteMany({ thread: threadId });
  await ChatThread.deleteOne({ _id: threadId });

  emitChatUpdate(io, {
    threadId,
    userId,
    payload: {
      type: 'deleted',
      deleted: true,
    },
  });

  return {
    threadId: threadId.toString(),
    userId: userId?.toString?.() || userId,
    deletedMessages: deletedMessages.deletedCount || 0,
  };
}

function formatMessage(message) {
  return {
    _id: message._id,
    thread: message.thread,
    senderRole: message.senderRole,
    sender: message.sender,
    senderName: message.senderName,
    body: message.body,
    deliveredToUser: Boolean(message.deliveredToUser),
    deliveredToAdmin: Boolean(message.deliveredToAdmin),
    readByUser: message.readByUser,
    readByAdmin: message.readByAdmin,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

router.get('/summary', authRequired, async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      await cleanupOrphanThreads(req.app.get('io'));

      const [totalThreads, unreadThreads, unreadMessages, priorityThreads] = await Promise.all([
        ChatThread.countDocuments(),
        ChatThread.countDocuments({ adminUnreadCount: { $gt: 0 } }),
        ChatThread.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: '$adminUnreadCount' },
            },
          },
        ]),
        ChatThread.countDocuments({ status: 'priority' }),
      ]);

      return res.json({
        role: 'admin',
        totalThreads,
        unreadThreads,
        unreadMessages: unreadMessages[0]?.total || 0,
        priorityThreads,
      });
    }

    const thread = await ChatThread.findOne({ user: req.userId }).select(
      'status userUnreadCount'
    );

    res.json({
      role: 'user',
      unreadCount: thread?.userUnreadCount || 0,
      hasThread: Boolean(thread),
      status: thread?.status || 'open',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await ensureMemberUser(req.userId);
    if (!user) {
      return res.status(403).json({ message: 'Kênh chat này chỉ dành cho tài khoản thành viên' });
    }

    const thread = await ensureThreadForUser(user);
    const messages = await ChatMessage.find({ thread: thread._id }).sort({ createdAt: 1 });

    res.json({
      thread: formatThread(thread, user),
      summary: {
        totalMessages: messages.length,
        unreadCount: thread.userUnreadCount,
      },
      messages: messages.map(formatMessage),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/me/messages', authRequired, async (req, res, next) => {
  try {
    const user = await ensureMemberUser(req.userId);
    if (!user) {
      return res.status(403).json({ message: 'Kênh chat này chỉ dành cho tài khoản thành viên' });
    }

    const body = req.body.body?.trim();
    if (!body) {
      return res.status(400).json({ message: 'Nội dung chat là bắt buộc' });
    }

    const thread = await ensureThreadForUser(user);
    const io = req.app.get('io');
    const deliveredToAdmin = roomHasConnections(io, 'admins');
    const message = await ChatMessage.create({
      thread: thread._id,
      senderRole: 'user',
      sender: user._id,
      senderName: user.name || user.email,
      body,
      deliveredToAdmin,
      readByUser: true,
      readByAdmin: false,
    });

    const updatedThread = await ChatThread.findByIdAndUpdate(
      thread._id,
      {
        $set: {
          lastMessage: body,
          lastMessageAt: message.createdAt,
          lastSenderRole: 'user',
        },
        $inc: {
          adminUnreadCount: 1,
        },
      },
      { new: true }
    );

    emitChatUpdate(io, {
      threadId: updatedThread._id,
      userId: updatedThread.user,
      payload: {
      type: 'message',
      senderRole: 'user',
      messageId: message._id.toString(),
      },
    });

    res.status(201).json({
      thread: formatThread(updatedThread, user),
      message: formatMessage(message),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/me/read', authRequired, async (req, res, next) => {
  try {
    const user = await ensureMemberUser(req.userId);
    if (!user) {
      return res.status(403).json({ message: 'Kênh chat này chỉ dành cho tài khoản thành viên' });
    }

    const thread = await ChatThread.findOne({ user: user._id });
    if (!thread) {
      return res.json({ ok: true });
    }

    await ChatMessage.updateMany(
      {
        thread: thread._id,
        senderRole: 'admin',
        readByUser: false,
      },
      {
        $set: {
          readByUser: true,
        },
      }
    );

    if (thread.userUnreadCount !== 0) {
      thread.userUnreadCount = 0;
      await thread.save();
    }

    const io = req.app.get('io');
    emitChatUpdate(io, {
      threadId: thread._id,
      userId: thread.user,
      payload: { type: 'read', readerRole: 'user' },
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/threads', authRequired, adminOnly, async (_req, res, next) => {
  try {
    await cleanupOrphanThreads(_req.app.get('io'));

    const threads = await ChatThread.find()
      .populate('user', 'name email role title')
      .sort({ lastMessageAt: -1, updatedAt: -1, createdAt: -1 });
    const totalsMap = await getThreadMessageCountMap(threads.map((thread) => thread._id));

    res.json(
      threads.map((thread) => ({
        ...formatThread(thread, thread.user),
        totalMessages: totalsMap.get(thread._id.toString()) || 0,
      }))
    );
  } catch (error) {
    next(error);
  }
});

router.get('/admin/threads/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const thread = await ChatThread.findById(req.params.id).populate(
      'user',
      'name email role title'
    );
    if (!thread) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const messages = await ChatMessage.find({ thread: thread._id }).sort({ createdAt: 1 });

    res.json({
      thread: formatThread(thread, thread.user),
      summary: {
        totalMessages: messages.length,
        unreadCount: thread.adminUnreadCount,
      },
      messages: messages.map(formatMessage),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/threads/:id/messages', authRequired, adminOnly, async (req, res, next) => {
  try {
    const body = req.body.body?.trim();
    if (!body) {
      return res.status(400).json({ message: 'Nội dung chat là bắt buộc' });
    }

    const [thread, admin] = await Promise.all([
      ChatThread.findById(req.params.id).populate('user', 'name email role title'),
      User.findById(req.userId).select('name email'),
    ]);

    if (!thread) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const io = req.app.get('io');
    const deliveredToUser = roomHasConnections(io, getUserRoom(thread.user?._id || thread.user));
    const message = await ChatMessage.create({
      thread: thread._id,
      senderRole: 'admin',
      sender: req.userId,
      senderName: admin?.name || admin?.email || 'Admin',
      body,
      deliveredToUser,
      readByUser: false,
      readByAdmin: true,
    });

    const updatedThread = await ChatThread.findByIdAndUpdate(
      thread._id,
      {
        $set: {
          lastMessage: body,
          lastMessageAt: message.createdAt,
          lastSenderRole: 'admin',
          adminUnreadCount: 0,
        },
        $inc: {
          userUnreadCount: 1,
        },
      },
      { new: true }
    ).populate('user', 'name email role title');

    emitChatUpdate(io, {
      threadId: updatedThread._id,
      userId: updatedThread.user?._id || updatedThread.user,
      payload: {
      type: 'message',
      senderRole: 'admin',
      messageId: message._id.toString(),
      },
    });

    res.status(201).json({
      thread: formatThread(updatedThread, updatedThread.user),
      message: formatMessage(message),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/threads/:id/read', authRequired, adminOnly, async (req, res, next) => {
  try {
    const thread = await ChatThread.findById(req.params.id);
    if (!thread) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    await ChatMessage.updateMany(
      {
        thread: thread._id,
        senderRole: 'user',
        readByAdmin: false,
      },
      {
        $set: {
          readByAdmin: true,
        },
      }
    );

    if (thread.adminUnreadCount !== 0) {
      thread.adminUnreadCount = 0;
      await thread.save();
    }

    const io = req.app.get('io');
    emitChatUpdate(io, {
      threadId: thread._id,
      userId: thread.user,
      payload: { type: 'read', readerRole: 'admin' },
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/threads/:id/status', authRequired, adminOnly, async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!['open', 'priority', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái cuộc chat không hợp lệ' });
    }

    const thread = await ChatThread.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email role title');

    if (!thread) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const io = req.app.get('io');
    emitChatUpdate(io, {
      threadId: thread._id,
      userId: thread.user?._id || thread.user,
      payload: { type: 'status', status },
    });

    res.json({ thread: formatThread(thread, thread.user) });
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/threads/:id', authRequired, adminOnly, async (req, res, next) => {
  try {
    const thread = await ChatThread.findById(req.params.id).populate('user', 'name email role title');
    if (!thread) {
      return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    }

    const io = req.app.get('io');
    const result = await deleteThreadConversation(thread, io);

    res.json({
      ok: true,
      threadId: result.threadId,
      deletedMessages: result.deletedMessages,
      user: thread.user
        ? {
            _id: thread.user._id,
            name: thread.user.name || '',
            email: thread.user.email || '',
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/threads', authRequired, adminOnly, async (req, res, next) => {
  try {
    const threads = await ChatThread.find()
      .populate('user', 'name email role title')
      .select('_id user');

    if (!threads.length) {
      return res.json({
        ok: true,
        deletedThreads: 0,
        deletedMessages: 0,
      });
    }

    const io = req.app.get('io');
    let deletedMessages = 0;

    for (const thread of threads) {
      const result = await deleteThreadConversation(thread, io);
      deletedMessages += result.deletedMessages;
    }

    res.json({
      ok: true,
      deletedThreads: threads.length,
      deletedMessages,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
