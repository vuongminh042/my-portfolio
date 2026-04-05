import { useEffect, useState } from 'react';
import api from '../../api';
import ConfirmModal from '../../components/ConfirmModal';
import { socket } from '../../realtime';

function SummaryCard({ label, value, tone }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-gradient-to-br p-5 dark:border-white/10 ${tone}`}
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-3 font-display text-4xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

const EMPTY_USERS = {
  summary: {
    total: 0,
    admins: 0,
    members: 0,
    today: 0,
    thisWeek: 0,
  },
  list: [],
};

export default function UsersAdmin() {
  const [data, setData] = useState(EMPTY_USERS);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [confirmUser, setConfirmUser] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const users = await api.get('/api/admin/users');
      setData(users);
      setErr(null);
      if (!silent) setMsg(null);
    } catch (e) {
      setErr(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});

    const refreshUsers = (payload) => {
      if (payload?.type && payload.type !== 'users') return;
      load({ silent: true }).catch(() => {});
    };

    socket.on('admin:updated', refreshUsers);

    return () => {
      socket.off('admin:updated', refreshUsers);
    };
  }, []);

  function requestRemoveUser(user) {
    setConfirmUser(user);
    setErr(null);
  }

  async function confirmRemoveUser() {
    if (!confirmUser) return;
    const label = confirmUser.name || confirmUser.email;
    try {
      setRemovingId(confirmUser._id);
      await api.delete(`/api/admin/users/${confirmUser._id}`);
      setMsg({ type: 'ok', text: `Đã xóa tài khoản ${label}.` });
      setConfirmUser(null);
      await load({ silent: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setRemovingId(null);
    }
  }

  const filtered = data.list.filter((user) => {
    const haystack = `${user.name || ''} ${user.email || ''} ${user.title || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(search.trim().toLowerCase());
    const matchesRole = role === 'all' || user.role === role;
    return matchesSearch && matchesRole;
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Người dùng đăng ký
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Theo dõi toàn bộ tài khoản đã tạo trên website, thời điểm đăng ký và vai trò hiện tại.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load().catch(() => {})}
          className="rounded-xl bg-slate-200/90 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        >
          Làm mới
        </button>
      </div>

      {err && <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">{err}</p>}
      {msg?.type === 'ok' && <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">{msg.text}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5 mb-8">
            <SummaryCard
              label="Tổng tài khoản"
              value={data.summary.total}
              tone="from-cyan-500/20 to-cyan-500/5"
            />
            <SummaryCard
              label="Quản trị viên"
              value={data.summary.admins}
              tone="from-fuchsia-500/20 to-fuchsia-500/5"
            />
            <SummaryCard
              label="Thành viên"
              value={data.summary.members}
              tone="from-emerald-500/20 to-emerald-500/5"
            />
            <SummaryCard
              label="Đăng ký hôm nay"
              value={data.summary.today}
              tone="from-amber-500/20 to-amber-500/5"
            />
            <SummaryCard
              label="7 ngày qua"
              value={data.summary.thisWeek}
              tone="from-violet-500/20 to-violet-500/5"
            />
          </div>

          <div className="glass rounded-2xl p-5 mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="block flex-1">
                <span className="mb-2 block text-xs uppercase text-slate-500">Tìm kiếm</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, email hoặc chức danh"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-surface-900/80 dark:text-white"
                />
              </label>

              <div>
                <p className="mb-2 text-xs uppercase text-slate-500">Vai trò</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'admin', label: 'Admin' },
                    { key: 'user', label: 'User' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setRole(item.key)}
                      className={`rounded-xl px-4 py-2 text-sm transition-colors ${
                        role === item.key
                          ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
                          : 'bg-slate-200/90 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100/80 text-left text-slate-600 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Người dùng</th>
                    <th className="px-5 py-4 font-medium">Email</th>
                    <th className="px-5 py-4 font-medium">Chức danh</th>
                    <th className="px-5 py-4 font-medium">Vai trò</th>
                    <th className="px-5 py-4 font-medium">Ngày đăng ký</th>
                    <th className="px-5 py-4 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr
                      key={user._id}
                      className="border-t border-slate-200/80 dark:border-white/10"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.name || 'Chưa cập nhật tên'}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        {user.email}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        {user.title || 'Chưa cập nhật'}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300'
                              : 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                        {new Date(user.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-4">
                        {user.role === 'admin' ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            Bảo vệ admin
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => requestRemoveUser(user)}
                            className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/20 dark:text-red-400"
                          >
                            Xóa tài khoản
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Không có tài khoản nào khớp với bộ lọc hiện tại.
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(confirmUser)}
        title="Xóa tài khoản người dùng?"
        description="Tài khoản này sẽ bị gỡ khỏi hệ thống quản trị và không thể đăng nhập lại nếu chưa đăng ký lại từ đầu."
        details={
          confirmUser && (
            <div className="space-y-2">
              <p className="font-medium text-slate-900 dark:text-white">
                {confirmUser.name || 'Chưa cập nhật tên'}
              </p>
              <p className="text-slate-600 dark:text-slate-300">{confirmUser.email}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  Vai trò: {confirmUser.role}
                </span>
                <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  Đăng ký: {new Date(confirmUser.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          )
        }
        confirmLabel="Xóa tài khoản"
        cancelLabel="Giữ lại"
        onCancel={() => {
          if (!removingId) setConfirmUser(null);
        }}
        onConfirm={() => {
          confirmRemoveUser().catch(() => {});
        }}
        loading={Boolean(confirmUser && removingId === confirmUser._id)}
      />
    </div>
  );
}
