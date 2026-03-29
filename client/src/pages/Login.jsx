import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const u = await login(email, password);
      navigate(u.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (ex) {
      setErr(ex.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md glass rounded-3xl p-8 border border-slate-200/90 dark:border-white/10"
        >
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Đăng nhập
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
            Tài khoản admin để quản trị portfolio.
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="text-xs text-slate-500 uppercase">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:bg-surface-900/80 dark:border-white/10 dark:text-white dark:focus:ring-accent/50"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 uppercase">Mật khẩu</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:bg-surface-900/80 dark:border-white/10 dark:text-white dark:focus:ring-accent/50"
              />
            </label>
            {err && <p className="text-sm text-red-400">{err}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold disabled:opacity-50"
            >
              {loading ? '…' : 'Đăng nhập'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-accent hover:underline">
              Đăng ký
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
