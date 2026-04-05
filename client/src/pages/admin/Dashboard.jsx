import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { socket } from '../../realtime';

const EMPTY_DATA = {
  totals: {
    users: 0,
    admins: 0,
    members: 0,
    projects: 0,
    featuredProjects: 0,
    skills: 0,
    messages: 0,
    unreadMessages: 0,
  },
  weekly: {
    users: { current: 0, previous: 0 },
    messages: { current: 0, previous: 0 },
  },
  activity: {
    registrations: [],
    messages: [],
  },
  userRoles: [],
  skillCategories: [],
  recentUsers: [],
  recentMessages: [],
};

function SummaryCard({ label, value, tone, subtext, to }) {
  const card = (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-gradient-to-br p-5 transition-colors dark:border-white/10 ${tone}`}
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-3 font-display text-4xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      {subtext && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{subtext}</p>}
    </div>
  );

  if (!to) return card;

  return (
    <Link
      to={to}
      className="block hover:[&>div]:border-cyan-400/50 dark:hover:[&>div]:border-cyan-400/40"
    >
      {card}
    </Link>
  );
}

function ActivityChart({ registrations, messages }) {
  const rows = registrations.map((item, index) => ({
    date: item.date,
    label: item.label,
    registrations: item.count,
    messages: messages[index]?.count || 0,
  }));
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.registrations, row.messages]));

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Hoạt động 14 ngày gần nhất
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            So sánh lượt đăng ký tài khoản và tin nhắn liên hệ theo ngày.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            Đăng ký
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-fuchsia-500" />
            Tin nhắn
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-7 gap-3 sm:grid-cols-14">
        {rows.map((row) => {
          const registrationHeight =
            row.registrations === 0 ? 6 : Math.max(10, (row.registrations / maxValue) * 120);
          const messageHeight =
            row.messages === 0 ? 6 : Math.max(10, (row.messages / maxValue) * 120);

          return (
            <div key={row.date} className="flex min-w-0 flex-col items-center">
              <div className="flex h-36 items-end gap-1.5">
                <div
                  className={`w-3 rounded-t-full ${
                    row.registrations === 0
                      ? 'bg-cyan-200/80 dark:bg-cyan-500/20'
                      : 'bg-cyan-500'
                  }`}
                  style={{ height: `${registrationHeight}px` }}
                  title={`Đăng ký: ${row.registrations}`}
                />
                <div
                  className={`w-3 rounded-t-full ${
                    row.messages === 0
                      ? 'bg-fuchsia-200/80 dark:bg-fuchsia-500/20'
                      : 'bg-fuchsia-500'
                  }`}
                  style={{ height: `${messageHeight}px` }}
                  title={`Tin nhắn: ${row.messages}`}
                />
              </div>
              <div className="mt-2 text-center">
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {row.label}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {row.registrations}/{row.messages}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistributionCard({ items }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Cơ cấu tài khoản</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Tỷ lệ giữa quản trị viên và thành viên đã đăng ký.
      </p>

      <div className="mt-6 flex overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
        {items.map((item, index) => {
          const width = total === 0 ? 0 : (item.value / total) * 100;
          const tone =
            index === 0
              ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
              : 'bg-gradient-to-r from-cyan-500 to-sky-500';

          return <div key={item.label} className={`h-4 ${tone}`} style={{ width: `${width}%` }} />;
        })}
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item, index) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  index === 0 ? 'bg-fuchsia-500' : 'bg-cyan-500'
                }`}
              />
              {item.label}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {total === 0 ? 0 : Math.round((item.value / total) * 100)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillCategoryCard({ items }) {
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Nhóm kỹ năng nổi bật
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Tổng hợp các category đang có trong portfolio.
          </p>
        </div>
        <Link to="/admin/skills" className="text-sm text-cyan-700 dark:text-cyan-300">
          Mở kỹ năng
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có dữ liệu kỹ năng.</p>
        )}
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
              <span className="text-slate-500 dark:text-slate-400">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-200/80 dark:bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatWeeklyText(current, previous, noun) {
  if (current === previous) return `${current} ${noun} trong 7 ngày qua`;
  const diff = Math.abs(current - previous);
  const direction = current > previous ? 'tăng' : 'giảm';
  return `${current} ${noun}, ${direction} ${diff} so với tuần trước`;
}

export default function Dashboard() {
  const [data, setData] = useState(EMPTY_DATA);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const overview = await api.get('/api/admin/overview');
      setData(overview);
      setErr(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});

    const refreshOverview = () => {
      load({ silent: true }).catch(() => {});
    };

    socket.on('admin:updated', refreshOverview);
    socket.on('portfolio:updated', refreshOverview);

    return () => {
      socket.off('admin:updated', refreshOverview);
      socket.off('portfolio:updated', refreshOverview);
    };
  }, []);

  const cards = [
    {
      label: 'Tài khoản',
      value: data.totals.users,
      subtext: formatWeeklyText(data.weekly.users.current, data.weekly.users.previous, 'tài khoản'),
      to: '/admin/users',
      tone: 'from-cyan-500/20 to-cyan-500/5',
    },
    {
      label: 'Tin nhắn',
      value: data.totals.messages,
      subtext: formatWeeklyText(data.weekly.messages.current, data.weekly.messages.previous, 'tin nhắn'),
      to: '/admin/messages',
      tone: 'from-fuchsia-500/20 to-fuchsia-500/5',
    },
    {
      label: 'Chưa đọc',
      value: data.totals.unreadMessages,
      subtext: 'Tin nhắn cần ưu tiên xử lý',
      to: '/admin/messages',
      tone: 'from-amber-500/20 to-amber-500/5',
    },
    {
      label: 'Dự án',
      value: data.totals.projects,
      subtext: `${data.totals.featuredProjects} dự án nổi bật`,
      to: '/admin/projects',
      tone: 'from-violet-500/20 to-violet-500/5',
    },
    {
      label: 'Kỹ năng',
      value: data.totals.skills,
      subtext: 'Danh mục năng lực đang hiển thị',
      to: '/admin/skills',
      tone: 'from-sky-500/20 to-sky-500/5',
    },
    {
      label: 'Thành viên',
      value: data.totals.members,
      subtext: `${data.totals.admins} quản trị viên`,
      to: '/admin/users',
      tone: 'from-emerald-500/20 to-emerald-500/5',
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Trung tâm quản trị
          </h1>
          <p className="max-w-3xl text-slate-600 dark:text-slate-400">
            Theo dõi tài khoản đăng ký, nhịp độ tin nhắn, phân bố dữ liệu portfolio và các thao
            tác quản trị mà không thay đổi những tính năng đang hoạt động của hệ thống.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/admin/users"
            className="rounded-xl bg-slate-200/90 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            Xem người dùng
          </Link>
          <Link
            to="/admin/messages"
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Quản lý tin nhắn
          </Link>
        </div>
      </div>

      {err && <p className="mb-6 text-sm text-amber-700 dark:text-amber-400">{err}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <SummaryCard key={card.label} {...card} />
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <ActivityChart
              registrations={data.activity.registrations}
              messages={data.activity.messages}
            />
            <DistributionCard items={data.userRoles} />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Tài khoản mới đăng ký
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Danh sách đăng ký gần nhất để theo dõi hoạt động người dùng.
                  </p>
                </div>
                <Link to="/admin/users" className="text-sm text-cyan-700 dark:text-cyan-300">
                  Xem tất cả
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {data.recentUsers.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có tài khoản nào.</p>
                )}
                {data.recentUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 px-4 py-3 dark:border-white/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-white">
                        {user.name || 'Chưa cập nhật tên'}
                      </p>
                      <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                        {user.email}
                      </p>
                      {user.title && (
                        <p className="truncate text-xs text-slate-500 dark:text-slate-500">
                          {user.title}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300'
                            : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                        }`}
                      >
                        {user.role}
                      </span>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Tin nhắn mới nhất
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Xem nhanh những liên hệ vừa gửi từ website.
                  </p>
                </div>
                <Link to="/admin/messages" className="text-sm text-cyan-700 dark:text-cyan-300">
                  Mở hộp thư
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {data.recentMessages.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có tin nhắn nào.</p>
                )}
                {data.recentMessages.map((message) => (
                  <div
                    key={message._id}
                    className={`rounded-2xl border px-4 py-3 ${
                      message.read
                        ? 'border-slate-200/80 dark:border-white/10'
                        : 'border-cyan-400/50 dark:border-cyan-400/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-white">
                          {message.name}
                        </p>
                        <p className="truncate text-sm text-slate-600 dark:text-slate-400">
                          {message.email}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          message.read
                            ? 'bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                            : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                        }`}
                      >
                        {message.read ? 'Đã đọc' : 'Chưa đọc'}
                      </span>
                    </div>
                    {message.subject && (
                      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {message.subject}
                      </p>
                    )}
                    <p className="mt-2 max-h-16 overflow-hidden text-sm text-slate-600 dark:text-slate-400">
                      {message.body}
                    </p>
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
                      {new Date(message.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <SkillCategoryCard items={data.skillCategories} />

            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Lối tắt quản trị
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Di chuyển nhanh tới các khu vực quan trọng mà không phải rời trang tổng quan.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  to="/admin/profile"
                  className="rounded-2xl border border-slate-200/80 px-4 py-4 text-sm text-slate-800 hover:border-cyan-400/50 dark:border-white/10 dark:text-white dark:hover:border-cyan-400/40"
                >
                  Hồ sơ công khai
                </Link>
                <Link
                  to="/admin/projects"
                  className="rounded-2xl border border-slate-200/80 px-4 py-4 text-sm text-slate-800 hover:border-cyan-400/50 dark:border-white/10 dark:text-white dark:hover:border-cyan-400/40"
                >
                  Danh sách dự án
                </Link>
                <Link
                  to="/admin/skills"
                  className="rounded-2xl border border-slate-200/80 px-4 py-4 text-sm text-slate-800 hover:border-cyan-400/50 dark:border-white/10 dark:text-white dark:hover:border-cyan-400/40"
                >
                  Cấu hình kỹ năng
                </Link>
                <Link
                  to="/admin/messages"
                  className="rounded-2xl border border-slate-200/80 px-4 py-4 text-sm text-slate-800 hover:border-cyan-400/50 dark:border-white/10 dark:text-white dark:hover:border-cyan-400/40"
                >
                  Hộp thư liên hệ
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
