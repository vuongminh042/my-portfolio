import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api';
import { useChatSummary } from '../../context/ChatContext';
import { socket } from '../../realtime';

const filters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'open', label: 'Đang mở' },
  { key: 'priority', label: 'Ưu tiên' },
  { key: 'resolved', label: 'Đã xử lý' },
];

function SummaryCard({ label, value, tone, subtext }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-gradient-to-br p-5 dark:border-white/10 ${tone}`}
    >
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
      <p className="mt-3 font-display text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
      {subtext && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{subtext}</p>}
    </div>
  );
}

function statusMeta(status) {
  if (status === 'priority') {
    return { label: 'Ưu tiên', tone: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' };
  }
  if (status === 'resolved') {
    return { label: 'Đã xử lý', tone: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' };
  }
  return { label: 'Đang mở', tone: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' };
}

export default function ChatsAdmin() {
  const { refreshChatSummary } = useChatSummary();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [confirmThread, setConfirmThread] = useState(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deletingThreadId, setDeletingThreadId] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const data = await api.get('/api/chat/admin/threads');
      setThreads(data);
      setErr(null);
      if (!silent) setMsg(null);
    } catch (error) {
      setErr(error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});

    const handleChatUpdated = () => {
      load({ silent: true }).catch(() => {});
    };

    socket.on('chat:updated', handleChatUpdated);

    return () => {
      socket.off('chat:updated', handleChatUpdated);
    };
  }, []);

  const storedThreads = useMemo(
    () => threads.filter((thread) => (thread.totalMessages || 0) > 0),
    [threads]
  );

  const filteredThreads = useMemo(() => {
    return storedThreads.filter((thread) => {
      const haystack =
        `${thread.user?.name || ''} ${thread.user?.email || ''} ${thread.title || ''} ${thread.lastMessage || ''}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      const matchesStatus = status === 'all' || thread.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [search, status, storedThreads]);

  const summary = useMemo(() => {
    return {
      totalThreads: storedThreads.length,
      totalMessages: storedThreads.reduce((sum, thread) => sum + (thread.totalMessages || 0), 0),
      unreadThreads: storedThreads.filter((thread) => thread.adminUnreadCount > 0).length,
      priorityThreads: storedThreads.filter((thread) => thread.status === 'priority').length,
    };
  }, [storedThreads]);

  function requestDeleteThread(thread) {
    setConfirmThread(thread);
    setErr(null);
  }

  async function confirmDeleteThread() {
    if (!confirmThread) return;

    try {
      setDeletingThreadId(confirmThread._id);
      const result = await api.delete(`/api/chat/admin/threads/${confirmThread._id}`);
      await refreshChatSummary().catch(() => {});
      setConfirmThread(null);
      setMsg({
        type: 'ok',
        text: `Đã xóa cuộc chat với ${result.user?.name || result.user?.email || 'user'} và ${result.deletedMessages} tin nhắn liên quan.`,
      });
      await load({ silent: true });
    } catch (error) {
      setErr(error.message);
    } finally {
      setDeletingThreadId(null);
    }
  }

  async function confirmDeleteAllThreads() {
    try {
      setDeletingAll(true);
      const result = await api.delete('/api/chat/admin/threads');
      await refreshChatSummary().catch(() => {});
      setConfirmBulkDelete(false);
      setMsg({
        type: 'ok',
        text: `Đã xóa ${result.deletedThreads} cuộc chat và ${result.deletedMessages} tin nhắn khỏi kho lưu trữ chat.`,
      });
      await load({ silent: true });
    } catch (error) {
      setErr(error.message);
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
            Quản lý chat
          </h1>
          <p className="max-w-3xl text-slate-600 dark:text-slate-400">
            Trang này lưu trữ tổng hợp các cuộc trò chuyện giữa quản trị viên và user. Khi xóa một
            cuộc chat, toàn bộ tin nhắn trong thread đó sẽ bị xóa sạch khỏi module chat.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => load().catch(() => {})}
            className="rounded-xl bg-slate-200/90 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            Làm mới
          </button>
          <button
            type="button"
            onClick={() => setConfirmBulkDelete(true)}
            disabled={loading || deletingAll || storedThreads.length === 0}
            className="rounded-xl bg-red-500/15 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400"
          >
            Xóa toàn bộ chat
          </button>
        </div>
      </div>

      {err && <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">{err}</p>}
      {msg?.type === 'ok' && (
        <p className="mb-4 text-sm text-emerald-600 dark:text-emerald-400">{msg.text}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent" />
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Cuộc chat đã lưu"
              value={summary.totalThreads}
              tone="from-cyan-500/20 to-cyan-500/5"
              subtext="Chỉ tính các thread đã có tin nhắn"
            />
            <SummaryCard
              label="Tổng tin nhắn"
              value={summary.totalMessages}
              tone="from-violet-500/20 to-violet-500/5"
              subtext="Sẽ bị xóa nếu xóa thread tương ứng"
            />
            <SummaryCard
              label="Thread chưa đọc"
              value={summary.unreadThreads}
              tone="from-amber-500/20 to-amber-500/5"
              subtext="Ưu tiên xử lý trước khi lưu trữ/xóa"
            />
            <SummaryCard
              label="Thread ưu tiên"
              value={summary.priorityThreads}
              tone="from-fuchsia-500/20 to-fuchsia-500/5"
              subtext="Đánh dấu từ màn hình chat realtime"
            />
          </div>

          <div className="glass mb-8 rounded-2xl p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <label className="block flex-1">
                <span className="mb-2 block text-xs uppercase text-slate-500">Tìm kiếm</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tên user, email, chủ đề hoặc tin nhắn gần nhất"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-surface-900/80 dark:text-white"
                />
              </label>

              <div>
                <p className="mb-2 text-xs uppercase text-slate-500">Trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  {filters.map((item) => (
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

          <div className="glass overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100/80 text-left text-slate-600 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-medium">Người dùng</th>
                    <th className="px-5 py-4 font-medium">Trạng thái</th>
                    <th className="px-5 py-4 font-medium">Tổng tin</th>
                    <th className="px-5 py-4 font-medium">Tin nhắn gần nhất</th>
                    <th className="px-5 py-4 font-medium">Cập nhật</th>
                    <th className="px-5 py-4 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredThreads.map((thread) => {
                    const meta = statusMeta(thread.status);
                    return (
                      <tr
                        key={thread._id}
                        className="border-t border-slate-200/80 dark:border-white/10"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {thread.user?.name || 'Tài khoản không xác định'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {thread.user?.email || 'Không có email'}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.tone}`}>
                              {meta.label}
                            </span>
                            {thread.adminUnreadCount > 0 && (
                              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                                {thread.adminUnreadCount} mới
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                          {thread.totalMessages || 0}
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                          <p className="line-clamp-2 max-w-xs">
                            {thread.lastMessage || 'Không có nội dung gần nhất'}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                          {thread.lastMessageAt
                            ? new Date(thread.lastMessageAt).toLocaleString('vi-VN')
                            : new Date(thread.updatedAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/admin/chat?thread=${thread._id}`}
                              className="rounded-lg bg-cyan-500/15 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-500/20 dark:text-cyan-300"
                            >
                              Mở chat
                            </Link>
                            <button
                              type="button"
                              onClick={() => requestDeleteThread(thread)}
                              disabled={deletingThreadId === thread._id}
                              className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
                            >
                              {deletingThreadId === thread._id ? 'Đang xóa…' : 'Xóa cuộc chat'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredThreads.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {storedThreads.length === 0
                  ? 'Chưa có cuộc chat nào được lưu trữ.'
                  : 'Không có cuộc chat nào khớp với bộ lọc hiện tại.'}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(confirmThread)}
        title="Xóa cuộc trò chuyện này?"
        description="Toàn bộ tin nhắn trong cuộc chat sẽ bị xóa vĩnh viễn khỏi module chat. Thao tác này không ảnh hưởng form liên hệ hay inbox cũ."
        details={
          confirmThread ? (
            <div className="space-y-2">
              <p className="font-medium text-slate-900 dark:text-white">
                {confirmThread.user?.name || 'Tài khoản không xác định'}
              </p>
              <p>{confirmThread.user?.email || 'Không có email'}</p>
              <p>{confirmThread.totalMessages || 0} tin nhắn sẽ bị xóa.</p>
            </div>
          ) : null
        }
        confirmLabel="Xóa cuộc chat"
        cancelLabel="Giữ lại"
        loading={Boolean(confirmThread) && deletingThreadId === confirmThread?._id}
        onCancel={() => {
          if (!deletingThreadId) setConfirmThread(null);
        }}
        onConfirm={() => {
          confirmDeleteThread().catch(() => {});
        }}
      />

      <ConfirmModal
        open={confirmBulkDelete}
        title="Xóa toàn bộ kho lưu trữ chat?"
        description="Thao tác này sẽ xóa sạch mọi cuộc trò chuyện và toàn bộ tin nhắn thuộc module chat realtime. Dữ liệu chat sẽ không thể khôi phục."
        details={
          <div className="space-y-2">
            <p className="font-medium text-slate-900 dark:text-white">
              {summary.totalThreads} cuộc chat sẽ bị xóa.
            </p>
            <p>{summary.totalMessages} tin nhắn sẽ bị gỡ khỏi hệ thống chat.</p>
          </div>
        }
        confirmLabel="Xóa toàn bộ"
        cancelLabel="Hủy"
        loading={deletingAll}
        onCancel={() => {
          if (!deletingAll) setConfirmBulkDelete(false);
        }}
        onConfirm={() => {
          confirmDeleteAllThreads().catch(() => {});
        }}
      />
    </div>
  );
}
