import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const MAX_AVATAR_SIZE = 8 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const initials = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview('');
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setErr('Ảnh đại diện chỉ hỗ trợ JPEG, PNG, GIF, WebP hoặc AVIF.');
      setAvatarFile(null);
      setAvatarPreview('');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setErr('Ảnh đại diện phải nhỏ hơn 8MB.');
      setAvatarFile(null);
      setAvatarPreview('');
      e.target.value = '';
      return;
    }

    const nextPreview = URL.createObjectURL(file);
    setErr('');
    setAvatarFile(file);
    setAvatarPreview(nextPreview);
    e.target.value = '';
  }

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreview('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      let avatar = '';
      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        try {
          const uploaded = await api.upload('/api/upload/register-avatar', fd);
          avatar = uploaded.avatar || '';
        } catch (uploadErr) {
          console.warn('Avatar upload failed during register:', uploadErr?.message || uploadErr);
        }
      }

      const u = await register(email, password, name, avatar);
      navigate(u.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (ex) {
      setErr(ex.message || 'Đăng ký thất bại');
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
            Đăng ký
          </h1>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-200 via-white to-cyan-100 dark:border-white/10 dark:from-[#162032] dark:via-[#0f172a] dark:to-[#0e7490]">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Xem trước avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-cyan-700 dark:text-accent-glow/90">
                      {initials}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">Ảnh đại diện</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Tùy chọn. Hỗ trợ JPEG, PNG, GIF, WebP, AVIF. Tối đa 8MB.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-200/90 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                        className="sr-only"
                        onChange={handleAvatarChange}
                      />
                      {avatarPreview ? 'Đổi ảnh khác' : 'Chọn ảnh đại diện'}
                    </label>

                    {avatarFile && (
                      <p className="max-w-[12rem] truncate text-xs text-slate-500 dark:text-slate-400">
                        {avatarFile.name}
                      </p>
                    )}

                    {avatarFile && (
                      <button
                        type="button"
                        onClick={clearAvatar}
                        className="text-xs font-medium text-red-500 hover:underline"
                      >
                        Xóa ảnh
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <label className="block">
              <span className="text-xs text-slate-500 uppercase">Tên hiển thị</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:bg-surface-900/80 dark:border-white/10 dark:text-white dark:focus:ring-accent/50"
              />
            </label>
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
                minLength={6}
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
              {loading ? 'Đang xử lý…' : 'Tạo tài khoản'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-accent hover:underline">
              Đăng nhập
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
