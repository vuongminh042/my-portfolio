import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useChatSummary } from '../../context/ChatContext';
import { socket } from '../../realtime';

const filters = [
  { key: 'all', label: 'Tất cả' },
  { key: 'open', label: 'Đang mở' },
  { key: 'priority', label: 'Ưu tiên' },
  { key: 'resolved', label: 'Đã xử lý' },
];

function OverviewCard({ label, value, tone, subtext }) {
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

function formatTime(value) {
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('vi-VN');
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

function getOutboundStatus(message) {
  if (message.readByUser) return 'Đã xem';
  if (message.deliveredToUser) return 'Đã nhận';
  return 'Đã gửi';
}

const EMPTY_ACTIVE = {
  thread: null,
  summary: {
    totalMessages: 0,
    unreadCount: 0,
  },
  messages: [],
};

export default function ChatAdmin() {
  const { refreshChatSummary } = useChatSummary();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [activeData, setActiveData] = useState(EMPTY_ACTIVE);
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const joinedThreadRef = useRef(null);
  const outboundTypingRef = useRef(false);
  const bottomRef = useRef(null);

  async function loadThreads({ silent = false } = {}) {
    if (!silent) setLoading(true);

    try {
      const list = await api.get('/api/chat/admin/threads');
      const requestedThreadId = searchParams.get('thread');
      setThreads(list);
      setActiveId((current) => {
        if (current && list.some((item) => item._id === current)) return current;
        if (requestedThreadId && list.some((item) => item._id === requestedThreadId)) {
          return requestedThreadId;
        }
        return list[0]?._id || null;
      });
      setErr(null);
    } catch (error) {
      setErr(error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadActiveThread(threadId, { silent = false } = {}) {
    if (!threadId) {
      setActiveData(EMPTY_ACTIVE);
      return;
    }

    if (!silent) setThreadLoading(true);

    try {
      const detail = await api.get(`/api/chat/admin/threads/${threadId}`);

      if (detail.summary.unreadCount > 0) {
        try {
          await api.patch(`/api/chat/admin/threads/${threadId}/read`, {});
          refreshChatSummary().catch(() => { });
        } catch {
          // Keep thread data rendered even if the read marker update fails once.
        }
        setThreads((current) =>
          current.map((thread) =>
            thread._id === threadId ? { ...thread, adminUnreadCount: 0 } : thread
          )
        );
        setActiveData({
          ...detail,
          thread: detail.thread
            ? {
              ...detail.thread,
              adminUnreadCount: 0,
            }
            : null,
          summary: {
            ...detail.summary,
            unreadCount: 0,
          },
          messages: detail.messages.map((message) =>
            message.senderRole === 'user'
              ? {
                ...message,
                readByAdmin: true,
              }
              : message
          ),
        });
      } else {
        setActiveData(detail);
      }

      setErr(null);
    } catch (error) {
      setErr(error.message);
    } finally {
      if (!silent) setThreadLoading(false);
    }
  }

  function emitTypingState(nextState) {
    if (!activeId) return;
    if (outboundTypingRef.current === nextState) return;

    outboundTypingRef.current = nextState;
    socket.emit('chat:typing', {
      threadId: activeId,
      isTyping: nextState,
    });
  }

  function stopTyping() {
    emitTypingState(false);
  }

  function handleDraftChange(event) {
    const nextDraft = event.target.value;
    setDraft(nextDraft);

    if (!nextDraft.trim()) {
      stopTyping();
      return;
    }

    emitTypingState(true);
  }

  useEffect(() => {
    loadThreads().catch(() => { });
  }, []);

  useEffect(() => {
    const handleChatEvent = (payload) => {
      loadThreads({ silent: true }).catch(() => { });
      if (payload?.type === 'deleted' && payload.threadId === activeId) {
        setTypingUser(null);
        setActiveData(EMPTY_ACTIVE);
        return;
      }
      if (payload?.threadId && payload.threadId === activeId) {
        loadActiveThread(payload.threadId, { silent: true }).catch(() => { });
      }
    };

    const handleTypingEvent = (payload) => {
      if (!payload?.threadId || payload.threadId !== activeId) return;
      if (payload.senderRole !== 'user') return;

      if (!payload.isTyping) {
        setTypingUser(null);
        return;
      }

      setTypingUser(payload.senderName || activeData.thread?.user?.name || 'Người dùng');
    };

    socket.on('chat:updated', handleChatEvent);
    socket.on('chat:typing', handleTypingEvent);

    return () => {
      socket.off('chat:updated', handleChatEvent);
      socket.off('chat:typing', handleTypingEvent);
      stopTyping();
    };
  }, [activeData.thread?.user?.name, activeId]);

  useEffect(() => {
    if (!activeId) {
      setSearchParams({}, { replace: true });
      setTypingUser(null);
      setActiveData(EMPTY_ACTIVE);
      return;
    }

    setSearchParams({ thread: activeId }, { replace: true });
    setTypingUser(null);
    loadActiveThread(activeId).catch(() => { });
  }, [activeId, setSearchParams]);

  useEffect(() => {
    if (!activeId) return undefined;

    if (joinedThreadRef.current && joinedThreadRef.current !== activeId) {
      socket.emit('chat:thread:leave', { threadId: joinedThreadRef.current });
    }

    joinedThreadRef.current = activeId;
    socket.emit('chat:thread:join', { threadId: activeId });

    return () => {
      if (joinedThreadRef.current === activeId) {
        socket.emit('chat:thread:leave', { threadId: activeId });
        joinedThreadRef.current = null;
      }
    };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [activeData.messages, typingUser]);

  async function handleSend(event) {
    event.preventDefault();
    if (!draft.trim() || !activeId) return;

    try {
      setSending(true);
      stopTyping();

      const response = await api.post(`/api/chat/admin/threads/${activeId}/messages`, {
        body: draft,
      });

      setActiveData((current) => ({
        thread: response.thread,
        summary: {
          totalMessages: current.summary.totalMessages + 1,
          unreadCount: 0,
        },
        messages: [...current.messages, response.message],
      }));
      setThreads((current) =>
        current.map((thread) => (thread._id === activeId ? response.thread : thread))
      );
      setDraft('');
      setErr(null);
      refreshChatSummary().catch(() => { });
    } catch (error) {
      setErr(error.message);
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    if (!activeId || activeData.thread?.status === nextStatus) return;

    try {
      setUpdatingStatus(true);
      const response = await api.patch(`/api/chat/admin/threads/${activeId}/status`, {
        status: nextStatus,
      });

      setActiveData((current) => ({
        ...current,
        thread: response.thread,
      }));
      setThreads((current) =>
        current.map((thread) => (thread._id === activeId ? response.thread : thread))
      );
      setErr(null);
      refreshChatSummary().catch(() => { });
    } catch (error) {
      setErr(error.message);
    } finally {
      setUpdatingStatus(false);
    }
  }

  const filteredThreads = useMemo(
    () =>
      threads.filter((thread) => {
        const haystack =
          `${thread.user?.name || ''} ${thread.user?.email || ''} ${thread.title || ''} ${thread.lastMessage || ''}`.toLowerCase();
        const matchesSearch = haystack.includes(search.trim().toLowerCase());
        const matchesStatus = status === 'all' || thread.status === status;
        return matchesSearch && matchesStatus;
      }),
    [search, status, threads]
  );

  const counters = useMemo(() => {
    const total = threads.length;
    const unreadThreads = threads.filter((thread) => thread.adminUnreadCount > 0).length;
    const unreadMessages = threads.reduce((sum, thread) => sum + (thread.adminUnreadCount || 0), 0);
    const priority = threads.filter((thread) => thread.status === 'priority').length;

    return { total, unreadThreads, unreadMessages, priority };
  }, [threads]);

  const activeThread = activeData.thread;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
            Chat Realtime
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold text-slate-900 dark:text-white">
            Hỗ trợ trực tuyến
          </h1>
          <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
            Module chat mới này chạy tách khỏi form liên hệ và hộp thư cũ. User nhắn ở trang chat,
            admin xử lý tại đây, cả hai bên cập nhật realtime qua socket riêng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadThreads().catch(() => { })}
          className="rounded-xl bg-slate-200/90 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
        >
          Làm mới
        </button>
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-4">
        <OverviewCard
          label="Cuộc trò chuyện"
          value={counters.total}
          tone="from-cyan-500/20 to-cyan-500/5"
          subtext="Mỗi user có một thread riêng"
        />
        <OverviewCard
          label="Thread chưa đọc"
          value={counters.unreadThreads}
          tone="from-red-500/20 to-red-500/5"
          subtext="Ít nhất 1 tin nhắn mới từ user"
        />
        <OverviewCard
          label="Tin nhắn mới"
          value={counters.unreadMessages}
          tone="from-amber-500/20 to-amber-500/5"
          subtext="Tổng số lượt user chưa được admin xem"
        />
        <OverviewCard
          label="Ưu tiên cao"
          value={counters.priority}
          tone="from-violet-500/20 to-violet-500/5"
          subtext="Có thể đổi trạng thái theo từng thread"
        />
      </div>

      {err && <p className="mb-6 text-sm text-red-500 dark:text-red-400">{err}</p>}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="glass rounded-3xl p-5">
              <div className="flex flex-col gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-500">
                    Tìm cuộc trò chuyện
                  </span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Tên, email, chủ đề..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:border-white/10 dark:bg-surface-900/80 dark:text-white"
                  />
                </label>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-500">Bộ lọc</p>
                  <div className="flex flex-wrap gap-2">
                    {filters.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setStatus(item.key)}
                        className={`rounded-xl px-4 py-2 text-sm transition-colors ${status === item.key
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

            <div className="space-y-3">
              {filteredThreads.map((thread) => {
                const meta = statusMeta(thread.status);
                return (
                  <button
                    key={thread._id}
                    type="button"
                    onClick={() => setActiveId(thread._id)}
                    className={`glass w-full rounded-3xl p-5 text-left transition-colors ${activeId === thread._id
                      ? 'border-cyan-400/50 dark:border-cyan-400/35'
                      : 'hover:border-cyan-400/40 dark:hover:border-cyan-400/20'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {thread.user?.name || 'Tài khoản không xác định'}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                          {thread.user?.email || 'Không có email'}
                        </p>
                      </div>
                      {thread.adminUnreadCount > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                          {thread.adminUnreadCount}
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${meta.tone}`}>
                        {meta.label}
                      </span>
                      {thread.user?.title && (
                        <span className="rounded-full bg-slate-200/90 px-3 py-1 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {thread.user.title}
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                      {thread.title}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                      {thread.lastMessage || 'Chưa có tin nhắn nào'}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{thread.lastMessageAt ? formatDateTime(thread.lastMessageAt) : 'Mới tạo'}</span>
                    </div>
                  </button>
                );
              })}

              {filteredThreads.length === 0 && (
                <div className="glass rounded-3xl p-6 text-sm text-slate-500 dark:text-slate-400">
                  Chưa có cuộc trò chuyện nào khớp với bộ lọc hiện tại.
                </div>
              )}
            </div>
          </aside>

          <section>
            <div className="glass overflow-hidden rounded-[32px]">
              {!activeId ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Chưa có user nào bắt đầu chat. Khi user gửi tin đầu tiên, thread sẽ xuất hiện tại đây.
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-200/80 bg-white/80 px-6 py-5 dark:border-white/10 dark:bg-surface-900/50">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 font-display text-xl font-bold text-white shadow-lg shadow-cyan-500/20">
                          {activeThread?.user?.name?.slice(0, 1) || 'U'}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            {activeThread?.user?.name || 'Tài khoản không xác định'}
                          </h2>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {activeThread?.user?.email || 'Không có email'}
                          </p>
                          {typingUser && (
                            <p className="mt-1 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                              {typingUser} đang soạn tin...
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {['open', 'priority', 'resolved'].map((item) => {
                          const meta = statusMeta(item);
                          const active = activeThread?.status === item;
                          return (
                            <button
                              key={item}
                              type="button"
                              disabled={updatingStatus}
                              onClick={() => handleStatusChange(item).catch(() => { })}
                              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${active
                                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
                                : `bg-slate-200/90 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 ${meta.tone}`
                                }`}
                            >
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_28%)] px-6 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_32%)]">
                    {threadLoading ? (
                      <div className="flex justify-center py-16">
                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent" />
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 flex items-center justify-center">
                          <span className="rounded-full border border-slate-200/90 bg-white/90 px-3 py-1 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                            {activeData.messages[0]
                              ? formatDateTime(activeData.messages[0].createdAt)
                              : 'Bắt đầu cuộc trò chuyện'}
                          </span>
                        </div>

                        <div className="space-y-4">
                          {activeData.messages.map((item) => {
                            const isAdminMessage = item.senderRole === 'admin';

                            return (
                              <div
                                key={item._id}
                                className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[85%] rounded-[24px] px-5 py-4 shadow-sm ${isAdminMessage
                                    ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
                                    : 'border border-slate-200/80 bg-white/90 text-slate-800 dark:border-white/10 dark:bg-surface-900/80 dark:text-slate-100'
                                    }`}
                                >
                                  <div className="mb-2 flex items-center gap-3 text-xs">
                                    <span
                                      className={`font-semibold ${isAdminMessage
                                        ? 'text-white/90'
                                        : 'text-cyan-700 dark:text-cyan-300'
                                        }`}
                                    >
                                      {item.senderName}
                                    </span>
                                  </div>
                                  <p className="whitespace-pre-wrap text-sm leading-6">{item.body}</p>
                                  <div
                                    className={`mt-3 flex items-center gap-2 text-[11px] ${isAdminMessage
                                      ? 'justify-end text-white/75'
                                      : 'justify-start text-slate-500 dark:text-slate-400'
                                      }`}
                                  >
                                    <span>{formatTime(item.createdAt)}</span>
                                    {isAdminMessage && <span>{getOutboundStatus(item)}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {typingUser && (
                            <div className="flex justify-start">
                              <div className="rounded-[22px] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-white/10 dark:bg-surface-900/80 dark:text-slate-300">
                                {typingUser} đang soạn tin...
                              </div>
                            </div>
                          )}

                          {/* {activeData.messages.length === 0 && (
                            <div className="rounded-[28px] border border-dashed border-slate-300/80 bg-white/65 px-6 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                              User này đã có thread nhưng chưa gửi nội dung nào.
                            </div>
                          )} */}

                          <div ref={bottomRef} />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="border-t border-slate-200/80 bg-white/85 p-6 dark:border-white/10 dark:bg-surface-900/55">
                    <form
                      onSubmit={handleSend}
                      className="rounded-[28px] border border-slate-200/90 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-surface-950/80"
                    >
                      <textarea
                        rows={4}
                        value={draft}
                        onChange={handleDraftChange}
                        placeholder="Nhập nội dung phản hồi cho user..."
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/35 dark:border-white/10 dark:bg-surface-900 dark:text-white dark:focus:ring-cyan-400/35"
                      />

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="submit"
                          disabled={sending || !draft.trim()}
                          className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {sending ? 'Đang gửi…' : 'Gửi phản hồi'}
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
