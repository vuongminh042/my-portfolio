import { Router } from 'express';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import Skill from '../models/Skill.js';
import User from '../models/User.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = Router();

const TZ_OFFSET = '+07:00';
const OFFSET_HOURS = 7;
const ACTIVITY_DAYS = 14;

function startOfDayInOffset(date, offsetHours = OFFSET_HOURS) {
  const shifted = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - offsetHours * 60 * 60 * 1000);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateKeyInOffset(date, offsetHours = OFFSET_HOURS) {
  const shifted = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function dateLabelInOffset(date, offsetHours = OFFSET_HOURS) {
  const shifted = new Date(date.getTime() + offsetHours * 60 * 60 * 1000);
  return shifted.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  });
}

function buildSeries(rows, totalDays = ACTIVITY_DAYS) {
  const todayStart = startOfDayInOffset(new Date());
  const rangeStart = addDays(todayStart, -(totalDays - 1));
  const rowMap = new Map(rows.map((row) => [row._id, row.count]));

  return Array.from({ length: totalDays }, (_, index) => {
    const pointDate = addDays(rangeStart, index);
    const key = dateKeyInOffset(pointDate);

    return {
      date: key,
      label: dateLabelInOffset(pointDate),
      count: rowMap.get(key) || 0,
    };
  });
}

function aggregateDaily(Model, match = {}) {
  return Model.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: TZ_OFFSET,
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

router.use(authRequired, adminOnly);

router.get('/overview', async (_req, res, next) => {
  try {
    const todayStart = startOfDayInOffset(new Date());
    const activityStart = addDays(todayStart, -(ACTIVITY_DAYS - 1));
    const weekStart = addDays(todayStart, -6);
    const previousWeekStart = addDays(weekStart, -7);

    const [
      totalUsers,
      totalAdmins,
      totalProjects,
      featuredProjects,
      totalSkills,
      totalMessages,
      unreadMessages,
      usersThisWeek,
      usersPreviousWeek,
      messagesThisWeek,
      messagesPreviousWeek,
      recentUsers,
      recentMessages,
      registrationRows,
      messageRows,
      skillCategories,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Project.countDocuments(),
      Project.countDocuments({ featured: true }),
      Skill.countDocuments(),
      Message.countDocuments(),
      Message.countDocuments({ read: false }),
      User.countDocuments({ createdAt: { $gte: weekStart } }),
      User.countDocuments({
        createdAt: {
          $gte: previousWeekStart,
          $lt: weekStart,
        },
      }),
      Message.countDocuments({ createdAt: { $gte: weekStart } }),
      Message.countDocuments({
        createdAt: {
          $gte: previousWeekStart,
          $lt: weekStart,
        },
      }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select('name email role title createdAt'),
      Message.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('name email subject body read createdAt'),
      aggregateDaily(User, { createdAt: { $gte: activityStart } }),
      aggregateDaily(Message, { createdAt: { $gte: activityStart } }),
      Skill.aggregate([
        {
          $project: {
            category: { $ifNull: ['$category', 'general'] },
          },
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 6 },
      ]),
    ]);

    const members = totalUsers - totalAdmins;

    res.json({
      totals: {
        users: totalUsers,
        admins: totalAdmins,
        members,
        projects: totalProjects,
        featuredProjects,
        skills: totalSkills,
        messages: totalMessages,
        unreadMessages,
      },
      weekly: {
        users: {
          current: usersThisWeek,
          previous: usersPreviousWeek,
        },
        messages: {
          current: messagesThisWeek,
          previous: messagesPreviousWeek,
        },
      },
      activity: {
        registrations: buildSeries(registrationRows),
        messages: buildSeries(messageRows),
      },
      userRoles: [
        { label: 'Admin', value: totalAdmins },
        { label: 'Thành viên', value: members },
      ],
      skillCategories: skillCategories.map((item) => ({
        label: item._id,
        value: item.count,
      })),
      recentUsers,
      recentMessages,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/users', async (_req, res, next) => {
  try {
    const todayStart = startOfDayInOffset(new Date());
    const weekStart = addDays(todayStart, -6);

    const [list, total, admins, today, thisWeek] = await Promise.all([
      User.find()
        .sort({ createdAt: -1 })
        .select('name email role title createdAt'),
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: weekStart } }),
    ]);

    res.json({
      summary: {
        total,
        admins,
        members: total - admins,
        today,
        thisWeek,
      },
      list,
    });
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id).select('role email name');
    if (!target) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (target.role === 'admin') {
      return res.status(400).json({
        message: 'Không thể xóa tài khoản admin từ màn hình này',
      });
    }

    await User.findByIdAndDelete(target._id);

    const io = req.app.get('io');
    if (io) {
      io.to('admins').emit('admin:updated', { type: 'users' });
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
