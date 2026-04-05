import { useEffect, useState } from 'react';
import api from '../api';
import Navbar from '../components/Navbar';
import { useInbox } from '../context/InboxContext';
import { socket } from '../realtime';

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

export default function UserMessages() {
  const [data, setData] = useState({
    summary: { total: 0, unreadReplies: 0, waitingReplies: 0 },
    list: [],
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const { refreshInbox } = useInbox();

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);

    try {
      const inbox = await api.get('/api/messages/mine');
      if (inbox.summary.unreadReplies > 0) {
        await api.patch('/api/messages/mine/read-replies', {});
        refreshInbox().catch(() => {});
        setData({
          summary: {
            ...inbox.summary,
            unreadReplies: 0,
          },
          list: inbox.list.map((message) =>
            message.reply?.body
              ? {
                  ...message,
                  reply: {
                    ...message.reply,
                    readByUser: true,
                  },
                }
              : message
          ),
        });
      } else {
        setData(inbox);
      }

      setErr(null);
    } catch (error) {
      setErr(error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});

    const handleInboxEvent = () => {
      load({ silent: true }).catch(() => {});
    };

    socket.on('user:messages', handleInboxEvent);

    return () => {
      socket.off('user:messages', handleInboxEvent);
    };
  }, []);

  return (
    <div className="min-h-screen px-4 pb-20 pt-32">
      <Navbar />
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Tin nhắn của bạn
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Xem các câu hỏi đã gửi từ form liên hệ và phản hồi mới nhất từ admin.
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

        {err && <p className="mb-4 text-sm text-red-500 dark:text-red-400">{err}</p>}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-5 md:grid-cols-3">
              <SummaryCard
                label="Tổng câu hỏi"
                value={data.summary.total}
                tone="from-cyan-500/20 to-cyan-500/5"
              />
              <SummaryCard
                label="Đang chờ phản hồi"
                value={data.summary.waitingReplies}
                tone="from-amber-500/20 to-amber-500/5"
              />
              <SummaryCard
                label="Phản hồi mới"
                value={data.summary.unreadReplies}
                tone="from-red-500/20 to-fuchsia-500/10"
              />
            </div>

            <div className="space-y-5">
              {data.list.map((message) => {
                const hasReply = Boolean(message.reply?.body);
                const hasUnreadReply = hasReply && message.reply.readByUser === false;

                return (
                  <div key={message._id} className="glass rounded-2xl p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {message.subject || 'Không có chủ đề'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Gửi lúc {new Date(message.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            message.read
                              ? 'bg-slate-200/80 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {message.read ? 'Admin đã xem' : 'Chưa xem'}
                        </span>
                        {hasUnreadReply && (
                          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                            Phản hồi mới
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-surface-900/40">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Câu hỏi của bạn
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                        {message.body}
                      </p>
                    </div>

                    {hasReply ? (
                      <div
                        className={`mt-4 rounded-2xl border p-4 ${
                          hasUnreadReply
                            ? 'border-red-400/60 bg-red-500/10'
                            : 'border-cyan-400/40 bg-cyan-500/10'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
                            Phản hồi từ {message.reply.adminName || 'Admin'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {message.reply.respondedAt
                              ? new Date(message.reply.respondedAt).toLocaleString('vi-VN')
                              : ''}
                          </p>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-slate-800 dark:text-white">
                          {message.reply.body}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300/80 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                        Admin chưa phản hồi câu hỏi này.
                      </div>
                    )}
                  </div>
                );
              })}

              {data.list.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Bạn chưa gửi câu hỏi nào qua form liên hệ.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
