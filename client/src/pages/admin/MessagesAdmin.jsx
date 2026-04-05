import { useEffect, useState } from 'react';
import api from '../../api';
import ConfirmModal from '../../components/ConfirmModal';
import { socket } from '../../realtime';

function MetricCard({ label, value, tone }) {
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

export default function MessagesAdmin() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingId, setReplyingId] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/api/messages');
      setList(data);
      if (!silent) setMsg(null);
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Không tải được tin nhắn' });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});

    const refreshMessages = (payload) => {
      if (payload?.type && payload.type !== 'messages') return;
      load({ silent: true }).catch(() => {});
    };

    socket.on('admin:updated', refreshMessages);

    return () => {
      socket.off('admin:updated', refreshMessages);
    };
  }, []);

  async function toggleRead(message) {
    try {
      await api.patch(`/api/messages/${message._id}/read`, { read: !message.read });
      await load({ silent: true });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
  }

  async function confirmRemoveMessage() {
    if (!confirmMessage) return;
    try {
      setRemovingId(confirmMessage._id);
      await api.delete(`/api/messages/${confirmMessage._id}`);
      setConfirmMessage(null);
      await load({ silent: true });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setRemovingId(null);
    }
  }

  async function saveReply(message) {
    const replyBody = (replyDrafts[message._id] ?? message.reply?.body ?? '').trim();
    if (!replyBody) {
      setMsg({ type: 'err', text: 'Nội dung phản hồi là bắt buộc.' });
      return;
    }

    try {
      setReplyingId(message._id);
      await api.patch(`/api/messages/${message._id}/reply`, { body: replyBody });
      setMsg({ type: 'ok', text: 'Đã gửi phản hồi cho người dùng.' });
      await load({ silent: true });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setReplyingId(null);
    }
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const unreadCount = list.filter((item) => !item.read).length;
  const todayCount = list.filter((item) => new Date(item.createdAt) >= todayStart).length;
  const repliedCount = list.filter((item) => item.reply?.body).length;
  const filtered = list.filter((item) => {
    const haystack =
      `${item.name} ${item.email} ${item.subject || ''} ${item.body} ${item.reply?.body || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(search.trim().toLowerCase());
    const matchesStatus =
      status === 'all' ||
      (status === 'unread' && !item.read) ||
      (status === 'read' && item.read) ||
      (status === 'replied' && Boolean(item.reply?.body)) ||
      (status === 'waiting' && !item.reply?.body);

    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Tin nhắn liên hệ
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Quản lý hộp thư từ form liên hệ với bộ lọc nhanh và trạng thái đã đọc.
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

      {msg && (
        <p className={`mb-4 text-sm ${msg.type === 'ok' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-400'}`}>
          {msg.text}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-5 md:grid-cols-4">
            <MetricCard
              label="Tổng tin nhắn"
              value={list.length}
              tone="from-fuchsia-500/20 to-fuchsia-500/5"
            />
            <MetricCard
              label="Chưa đọc"
              value={unreadCount}
              tone="from-amber-500/20 to-amber-500/5"
            />
            <MetricCard
              label="Hôm nay"
              value={todayCount}
              tone="from-cyan-500/20 to-cyan-500/5"
            />
            <MetricCard
              label="Đã phản hồi"
              value={repliedCount}
              tone="from-emerald-500/20 to-emerald-500/5"
            />
          </div>

          <div className="glass rounded-2xl p-5 mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="block flex-1">
                <span className="mb-2 block text-xs uppercase text-slate-500">Tìm kiếm</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, email, tiêu đề hoặc nội dung"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-surface-900/80 dark:text-white"
                />
              </label>

              <div>
                <p className="mb-2 text-xs uppercase text-slate-500">Trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'Tất cả' },
                    { key: 'unread', label: 'Chưa đọc' },
                    { key: 'read', label: 'Đã đọc' },
                    { key: 'waiting', label: 'Chờ trả lời' },
                    { key: 'replied', label: 'Đã trả lời' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setStatus(item.key)}
                      className={`rounded-xl px-4 py-2 text-sm transition-colors ${
                        status === item.key
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

          <div className="space-y-4">
            {filtered.map((message) => (
              <div
                key={message._id}
                className={`glass rounded-2xl p-6 border ${
                  message.read
                    ? 'border-slate-200 dark:border-white/5'
                    : 'border-cyan-400/50 dark:border-accent/30'
                }`}
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">
                      {message.name}
                    </p>
                    <p className="truncate text-sm text-slate-600 dark:text-slate-500">
                      {message.email}
                    </p>
                    {message.subject && (
                      <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        {message.subject}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.user ? (
                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                          Gắn với tài khoản website
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200/80 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          Khách chưa đăng nhập
                        </span>
                      )}
                      {message.reply?.body && (
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          Đã phản hồi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRead(message)}
                      className="rounded-lg bg-slate-200/90 px-3 py-1.5 text-xs text-slate-700 dark:bg-white/10 dark:text-slate-300"
                    >
                      {message.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmMessage(message)}
                      className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs text-red-400"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                  {message.body}
                </p>

                {message.reply?.body && (
                  <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                        Phản hồi đã gửi
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {message.reply.respondedAt
                          ? new Date(message.reply.respondedAt).toLocaleString('vi-VN')
                          : ''}
                      </p>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                      {message.reply.body}
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-surface-900/40">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Phản hồi cho người gửi
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {message.user
                          ? 'Khi gửi, user sẽ nhận badge đỏ realtime trong mục Tin nhắn.'
                          : 'Tin nhắn này không gắn tài khoản, phản hồi sẽ chỉ lưu tại admin.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveReply(message)}
                      disabled={replyingId === message._id}
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {replyingId === message._id ? 'Đang gửi…' : message.reply?.body ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={replyDrafts[message._id] ?? message.reply?.body ?? ''}
                    onChange={(e) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [message._id]: e.target.value,
                      }))
                    }
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-surface-900/80 dark:text-white"
                    placeholder="Nhập phản hồi của admin..."
                  />
                </div>

                <p className="mt-4 text-xs text-slate-500 dark:text-slate-600">
                  {new Date(message.createdAt).toLocaleString('vi-VN')}
                </p>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Không có tin nhắn nào khớp với bộ lọc hiện tại.
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(confirmMessage)}
        title="Xóa tin nhắn liên hệ?"
        description="Tin nhắn này sẽ bị xóa khỏi hộp thư quản trị. Nếu đã có phản hồi, phần phản hồi cũng không còn hiển thị trong admin."
        details={
          confirmMessage && (
            <div className="space-y-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{confirmMessage.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {confirmMessage.email}
                </p>
              </div>
              {confirmMessage.subject && (
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  Chủ đề: {confirmMessage.subject}
                </p>
              )}
              <p className="max-h-16 overflow-hidden text-sm text-slate-600 dark:text-slate-300">
                {confirmMessage.body}
              </p>
            </div>
          )
        }
        confirmLabel="Xóa tin nhắn"
        cancelLabel="Hủy"
        onCancel={() => {
          if (!removingId) setConfirmMessage(null);
        }}
        onConfirm={() => {
          confirmRemoveMessage().catch(() => {});
        }}
        loading={Boolean(confirmMessage && removingId === confirmMessage._id)}
      />
    </div>
  );
}
