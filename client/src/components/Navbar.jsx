import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInbox } from '../context/InboxContext';
import ThemeToggle from './ThemeToggle';

const links = [
  { href: '#about', label: 'Giới thiệu' },
  { href: '#skills', label: 'Kỹ năng' },
  { href: '#projects', label: 'Dự án' },
  { href: '#contact', label: 'Liên hệ' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const { unreadReplies } = useInbox();
  const onHome = pathname === '/';
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    if (!accountOpen) return;

    const onDocClick = (e) => {
      const el = accountRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setAccountOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setAccountOpen(false);
    };

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [accountOpen]);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50 px-4 pt-4"
    >
      <nav className="mx-auto max-w-6xl flex items-center justify-between gap-4 rounded-2xl glass px-5 py-3">
        <Link
          to="/"
          className="font-display font-bold text-lg tracking-tight text-slate-900 dark:text-white"
        >
          <span className="inline-flex items-center gap-1">
            <span className="text-gradient">Minh</span>
            <span className="text-slate-500 font-medium dark:text-slate-400">Dev</span>
          </span>
        </Link>
        {onHome && (
          <ul className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((p) => !p)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                className="text-sm px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5 transition-colors inline-flex items-center gap-2"
              >
                {unreadReplies > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
                    {unreadReplies}
                  </span>
                )}
                Thông tin tài khoản
                <span className="text-xs opacity-70">{accountOpen ? '▲' : '▼'}</span>
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-72 rounded-2xl glass border border-slate-200/80 dark:border-white/10 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-200/70 dark:border-white/10">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                      {user?.name || 'Tài khoản'}
                    </div>
                    <div className="text-xs mt-1 text-slate-600 dark:text-slate-300 truncate">
                      {user?.email}
                    </div>
                    <div className="text-xs mt-2 text-cyan-700 dark:text-accent">
                      Role: {user?.role}
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <Link
                      to="/messages"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      <span>Tin nhắn</span>
                      {unreadReplies > 0 && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                          {unreadReplies}
                        </span>
                      )}
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="block px-3 py-2 rounded-xl text-sm text-cyan-800 bg-cyan-500/10 hover:bg-cyan-500/20 dark:text-accent dark:bg-accent/15"
                      >
                        Mở trang Admin
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="w-full text-left block px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold hover:opacity-90 transition-opacity dark:text-surface-950"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </nav>
    </motion.header>
  );
}
