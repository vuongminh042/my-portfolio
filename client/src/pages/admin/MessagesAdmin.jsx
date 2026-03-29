import { useEffect, useState } from 'react';
import api from '../../api';

export default function MessagesAdmin() {
  const [list, setList] = useState([]);
  const [msg, setMsg] = useState(null);

  async function load() {
    const data = await api.get('/api/messages');
    setList(data);
  }

  useEffect(() => {
    load().catch(() => setMsg({ type: 'err', text: 'Không tải được tin nhắn' }));
  }, []);

  async function toggleRead(m) {
    try {
      await api.patch(`/api/messages/${m._id}/read`, { read: !m.read });
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
  }

  async function remove(id) {
    if (!confirm('Xóa tin nhắn?')) return;
    try {
      await api.delete(`/api/messages/${id}`);
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Tin nhắn liên hệ
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">Từ form trên trang chủ</p>
      {msg?.type === 'err' && <p className="text-red-400 text-sm mb-4">{msg.text}</p>}

      <div className="space-y-4">
        {list.map((m) => (
          <div
            key={m._id}
            className={`glass rounded-2xl p-6 border ${
              m.read ? 'border-slate-200 dark:border-white/5' : 'border-cyan-400/50 dark:border-accent/30'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-slate-900 dark:text-white font-medium">{m.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-500">{m.email}</p>
                {m.subject && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{m.subject}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => toggleRead(m)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-200/90 text-slate-700 dark:bg-white/10 dark:text-slate-300"
                >
                  {m.read ? 'Đánh dấu chưa đọc' : 'Đã đọc'}
                </button>
                <button
                  type="button"
                  onClick={() => remove(m._id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400"
                >
                  Xóa
                </button>
              </div>
            </div>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm">{m.body}</p>
            <p className="text-xs text-slate-500 dark:text-slate-600 mt-4">
              {new Date(m.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        ))}
        {list.length === 0 && <p className="text-slate-500">Chưa có tin nhắn.</p>}
      </div>
    </div>
  );
}
