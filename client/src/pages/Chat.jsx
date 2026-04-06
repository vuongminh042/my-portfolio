import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useChatSummary } from '../context/ChatContext';
import { socket } from '../realtime';

const suggestionChips = [
  'Tư vấn dự án React',
  'Hỏi về dashboard admin',
  'Cần báo giá landing page',
  'Đặt lịch trao đổi nhanh',
];

const EMPTY_DATA = {
  thread: null,
  summary: {
    totalMessages: 0,
    unreadCount: 0,
  },
  messages: [],
};

function StatusCard({ label, value, tone, subtext }) {
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

function formatDate(value) {
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function threadTone(status) {
  if (status === 'priority') return 'Ưu tiên';
  if (status === 'resolved') return 'Đã xử lý';
  return 'Đang mở';
}

function getOutboundStatus(message) {
  if (message.readByAdmin) return 'Đã xem';
  if (message.deliveredToAdmin) return 'Đã nhận';
  return 'Đã gửi';
}

export default function Chat() {
  const { user, isAdmin } = useAuth();
  const { refreshChatSummary } = useChatSummary();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const joinedThreadRef = useRef(null);
  const outboundTypingRef = useRef(false);
  const bottomRef = useRef(null);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);

    try {
      const chat = await api.get('/api/chat/me');

      if (chat.summary.unreadCount > 0) {
        try {
          await api.patch('/api/chat/me/read', {});
          refreshChatSummary().catch(() => { });
        } catch {
          // Keep the conversation visible even if marking as read fails transiently.
        }

        setData({
          ...chat,
          thread: chat.thread
            ? {
              ...chat.thread,
              userUnreadCount: 0,
            }
            : null,
          summary: {
            ...chat.summary,
            unreadCount: 0,
          },
          messages: chat.messages.map((message) =>
            message.senderRole === 'admin'
              ? {
                ...message,
                readByUser: true,
              }
              : message
          ),
        });
      } else {
        setData(chat);
      }

      setErr(null);
    } catch (error) {
      setErr(error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function emitTypingState(nextState) {
    const threadId = data.thread?._id;
    if (!threadId) return;
    if (outboundTypingRef.current === nextState) return;

    outboundTypingRef.current = nextState;
    socket.emit('chat:typing', {
      threadId,
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
    if (isAdmin) {
      setLoading(false);
      setData(EMPTY_DATA);
      return undefined;
    }

    load().catch(() => { });

    const handleChatEvent = () => {
      load({ silent: true }).catch(() => { });
    };

    const handleTypingEvent = (payload) => {
      if (!payload?.threadId || payload.threadId !== data.thread?._id) return;
      if (payload.senderRole === 'user') return;

      if (!payload.isTyping) {
        setTypingUser(null);
        return;
      }

      setTypingUser(payload.senderName || 'Quản trị viên');
    };

    socket.on('chat:updated', handleChatEvent);
    socket.on('chat:typing', handleTypingEvent);

    return () => {
      socket.off('chat:updated', handleChatEvent);
      socket.off('chat:typing', handleTypingEvent);
      stopTyping();
    };
  }, [data.thread?._id, isAdmin]);

  useEffect(() => {
    const threadId = data.thread?._id;
    if (!threadId || isAdmin) return undefined;

    if (joinedThreadRef.current && joinedThreadRef.current !== threadId) {
      socket.emit('chat:thread:leave', { threadId: joinedThreadRef.current });
    }

    joinedThreadRef.current = threadId;
    socket.emit('chat:thread:join', { threadId });

    return () => {
      if (joinedThreadRef.current === threadId) {
        socket.emit('chat:thread:leave', { threadId });
        joinedThreadRef.current = null;
      }
    };
  }, [data.thread?._id, isAdmin]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  }, [data.messages, typingUser]);

  async function handleSend(event) {
    event.preventDefault();
    if (!draft.trim()) return;

    try {
      setSending(true);
      stopTyping();

      const response = await api.post('/api/chat/me/messages', {
        body: draft,
      });

      setData((current) => ({
        thread: response.thread,
        summary: {
          totalMessages: current.summary.totalMessages + 1,
          unreadCount: current.summary.unreadCount,
        },
        messages: [...current.messages, response.message],
      }));
      setDraft('');
      setErr(null);
      refreshChatSummary().catch(() => { });
    } catch (error) {
      setErr(error.message);
    } finally {
      setSending(false);
    }
  }

  const stats = useMemo(
    () => [
      {
        label: 'Trạng thái',
        value: data.thread ? threadTone(data.thread.status) : 'Sẵn sàng',
        tone: 'from-cyan-500/20 to-cyan-500/5',
        subtext: 'Kênh chat riêng giữa user và admin',
      },
      {
        label: 'Tổng tin nhắn',
        value: data.summary.totalMessages,
        tone: 'from-violet-500/20 to-violet-500/5',
        subtext: 'Lưu lịch sử theo thời gian thực',
      },
      {
        label: 'Chưa đọc',
        value: data.thread?.userUnreadCount || 0,
        tone: 'from-emerald-500/20 to-emerald-500/5',
        subtext: 'Sẽ tự về 0 khi bạn mở cuộc chat',
      },
    ],
    [data]
  );

  if (isAdmin) {
    return (
      <div className="min-h-screen px-4 pb-20 pt-32">
        <Navbar />
        <div className="mx-auto max-w-3xl glass rounded-[32px] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700 dark:text-cyan-300">
            Chat Realtime
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-slate-900 dark:text-white">
            Tài khoản admin dùng giao diện quản trị
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400">
            Để tránh trộn lẫn luồng user và admin, tài khoản quản trị sẽ dùng trang chat riêng trong
            khu admin.
          </p>
          <Link
            to="/admin/chat"
            className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white"
          >
            Mở chat quản trị
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pb-20 pt-32">
      <Navbar />

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
              Chat đang hoạt động
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold text-slate-900 dark:text-white">
              Chat Với quản trị viên
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
              Kênh chat này tách riêng khỏi form liên hệ và hộp thư hiện có. Tin nhắn gửi tại đây sẽ
              chỉ đi qua module chat mới, không ảnh hưởng các tính năng cũ.
            </p>
          </div>

          <button
            type="button"
            onClick={() => load().catch(() => { })}
            className="rounded-xl bg-slate-200/90 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            Làm mới
          </button>
        </div>

        <div className="mb-8 grid gap-5 md:grid-cols-3">
          {stats.map((item) => (
            <StatusCard key={item.label} {...item} />
          ))}
        </div>

        {err && <p className="mb-6 text-sm text-red-500 dark:text-red-400">{err}</p>}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent" />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-6">
              <div className="glass rounded-3xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                      Kênh trò chuyện riêng
                    </h2>
                  </div>
                  <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_14px] shadow-emerald-500/60" />
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-surface-900/40">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    Xin chào {user?.name || user?.email}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Khi admin phản hồi, đoạn chat này sẽ cập nhật ngay mà không cần tải lại trang.
                  </p>
                </div>
              </div>

              <div className="glass rounded-3xl p-6">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Gợi ý bắt đầu
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {suggestionChips.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="rounded-full border border-slate-200/90 bg-white/90 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                      onClick={() => setDraft((current) => (current ? current : item))}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            <section className="glass overflow-hidden rounded-[32px]">
              <div className="border-b border-slate-200/80 bg-white/80 px-6 py-5 dark:border-white/10 dark:bg-surface-900/50">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 font-display text-xl font-bold text-white shadow-lg shadow-cyan-500/20">
                      A
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Quản trị viên hỗ trợ trực tuyến
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Trạng thái hiện tại: {data.thread ? threadTone(data.thread.status) : 'Đang mở'}
                      </p>
                      {typingUser && (
                        <p className="mt-1 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                          {typingUser} đang soạn tin...
                        </p>
                      )}
                    </div>
                  </div>

                  {data.thread?.lastMessageAt && (
                    <span className="rounded-full bg-slate-200/80 px-3 py-2 text-xs text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      Cập nhật {formatDate(data.thread.lastMessageAt)}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.08),transparent_28%)] px-6 py-6 dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_32%)]">
                <div className="mb-4 flex items-center justify-center">
                  <span className="rounded-full border border-slate-200/90 bg-white/90 px-3 py-1 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                    {data.messages.length > 0
                      ? formatDate(data.messages[0].createdAt)
                      : 'Bắt đầu cuộc trò chuyện'}
                  </span>
                </div>

                <div className="space-y-4">
                  {data.messages.map((item) => {
                    const isUserMessage = item.senderRole === 'user';

                    return (
                      <div
                        key={item._id}
                        className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-[24px] px-5 py-4 shadow-sm ${isUserMessage
                            ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white'
                            : 'border border-slate-200/80 bg-white/90 text-slate-800 dark:border-white/10 dark:bg-surface-900/80 dark:text-slate-100'
                            }`}
                        >
                          <div className="mb-2 flex items-center gap-3 text-xs">
                            <span
                              className={`font-semibold ${isUserMessage ? 'text-white/90' : 'text-cyan-700 dark:text-cyan-300'
                                }`}
                            >
                              {isUserMessage ? 'Bạn' : item.senderName}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6">{item.body}</p>
                          <div
                            className={`mt-3 flex items-center gap-2 text-[11px] ${isUserMessage
                              ? 'justify-end text-white/75'
                              : 'justify-start text-slate-500 dark:text-slate-400'
                              }`}
                          >
                            <span>{formatTime(item.createdAt)}</span>
                            {isUserMessage && <span>{getOutboundStatus(item)}</span>}
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

                  {/* {data.messages.length === 0 && (
                    <div className="rounded-[28px] border border-dashed border-slate-300/80 bg-white/65 px-6 py-10 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                      Chưa có tin nhắn nào. Bạn có thể bắt đầu cuộc trò chuyện với admin ngay bên dưới.
                    </div>
                  )} */}

                  <div ref={bottomRef} />
                </div>
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
                    placeholder="Nhập nội dung bạn muốn gửi cho quản trị viên..."
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/35 dark:border-white/10 dark:bg-surface-900 dark:text-white dark:focus:ring-cyan-400/35"
                  />

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="submit"
                      disabled={sending || !draft.trim()}
                      className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? 'Đang gửi…' : 'Gửi tin nhắn'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
