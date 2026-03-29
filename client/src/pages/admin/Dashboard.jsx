import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function Dashboard() {
  const [counts, setCounts] = useState({ projects: 0, skills: 0, messages: 0, unread: 0 });
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [projects, skills, messages] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/skills'),
          api.get('/api/messages'),
        ]);
        setCounts({
          projects: projects.length,
          skills: skills.length,
          messages: messages.length,
          unread: messages.filter((m) => !m.read).length,
        });
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, []);

  const cards = [
    { label: 'Dự án', value: counts.projects, to: '/admin/projects', color: 'from-cyan-500/20 to-cyan-500/5' },
    { label: 'Kỹ năng', value: counts.skills, to: '/admin/skills', color: 'from-violet-500/20 to-violet-500/5' },
    {
      label: 'Tin nhắn',
      value: counts.messages,
      sub: counts.unread ? `${counts.unread} chưa đọc` : null,
      to: '/admin/messages',
      color: 'from-fuchsia-500/20 to-fuchsia-500/5',
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">Tổng quan</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-10">
        Quản lý nội dung portfolio và tin nhắn liên hệ.
      </p>
      {err && <p className="text-amber-700 dark:text-amber-400 text-sm mb-6">{err}</p>}
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className={`rounded-2xl border border-slate-200 p-6 bg-gradient-to-br dark:border-white/10 ${c.color} hover:border-cyan-400/50 dark:hover:border-accent/30 transition-colors`}
          >
            <p className="text-slate-600 dark:text-slate-400 text-sm">{c.label}</p>
            <p className="font-display text-4xl font-bold text-slate-900 dark:text-white mt-2">
              {c.value}
            </p>
            {c.sub && (
              <p className="text-xs text-cyan-700 dark:text-accent mt-2">{c.sub}</p>
            )}
          </Link>
        ))}
      </div>
      <div className="glass rounded-2xl p-6 max-w-2xl">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Bước tiếp theo</h2>
        <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-2 text-sm">
          <li>
            Cập nhật{' '}
            <Link className="text-cyan-700 dark:text-accent" to="/admin/profile">
              hồ sơ và avatar
            </Link>
          </li>
          <li>
            Thêm{' '}
            <Link className="text-cyan-700 dark:text-accent" to="/admin/skills">
              kỹ năng
            </Link>{' '}
            và{' '}
            <Link className="text-cyan-700 dark:text-accent" to="/admin/projects">
              dự án
            </Link>
          </li>
          <li>Kiểm tra form liên hệ trên trang chủ và xem tin nhắn tại đây.</li>
        </ol>
      </div>
    </div>
  );
}
