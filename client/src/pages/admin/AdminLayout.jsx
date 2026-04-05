import { motion } from 'framer-motion';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle';

const nav = [
  { to: '/admin', end: true, label: 'Tổng quan' },
  { to: '/admin/profile', label: 'Hồ sơ & Avatar' },
  { to: '/admin/users', label: 'Người dùng' },
  { to: '/admin/projects', label: 'Dự án' },
  { to: '/admin/skills', label: 'Kỹ năng' },
  { to: '/admin/messages', label: 'Tin nhắn' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-surface-950">
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 dark:border-white/10 glass">
        <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display font-bold text-slate-900 dark:text-white">Admin</p>
            <p className="text-xs text-slate-500 truncate mt-1">{user?.email}</p>
          </div>
          <ThemeToggle className="shrink-0" />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-700 dark:bg-accent/15 dark:text-accent'
                    : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-white/10 space-y-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
          >
            Xem trang chủ
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="w-full py-2 rounded-xl text-sm text-red-400/90 hover:bg-red-500/10"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between gap-3 px-4 py-4 border-b border-slate-200 dark:border-white/10">
          <span className="font-display font-semibold text-slate-900 dark:text-white">Admin</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-cyan-700 dark:text-accent"
            >
              Trang chủ
            </button>
          </div>
        </header>
        <div className="md:hidden flex overflow-x-auto gap-2 px-4 py-3 border-b border-slate-200 dark:border-white/10">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 px-3 py-2 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-700 dark:bg-accent/15 dark:text-accent'
                    : 'text-slate-600 dark:text-slate-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 p-6 md:p-10 overflow-auto"
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
