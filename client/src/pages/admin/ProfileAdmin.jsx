import { useEffect, useState } from 'react';
import api, { assetUrl } from '../../api';
import AvatarDisplay from '../../components/AvatarDisplay';

const MAX_AVATAR_SIZE = 8 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

export default function ProfileAdmin() {
  const [form, setForm] = useState({
    name: '',
    title: '',
    bio: '',
    facebook: '',
    tiktok: '',
    avatar: '',
    backgroundMusicEnabled: true,
  });
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/api/auth/me');
        setForm({
          name: me.name || '',
          title: me.title || '',
          bio: me.bio || '',
          facebook: me.facebook || '',
          tiktok: me.tiktok || '',
          avatar: me.avatar || '',
          backgroundMusicEnabled: me.backgroundMusicEnabled ?? true,
        });
      } catch {
        setMsg({ type: 'err', text: 'Không tải được hồ sơ' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.patch('/api/profile', {
        name: form.name,
        title: form.title,
        bio: form.bio,
        facebook: form.facebook,
        tiktok: form.tiktok,
        backgroundMusicEnabled: form.backgroundMusicEnabled,
      });
      setMsg({ type: 'ok', text: 'Đã lưu hồ sơ.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setMsg({ type: 'err', text: 'Ảnh đại diện chỉ hỗ trợ JPEG, PNG, GIF, WebP hoặc AVIF.' });
      e.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setMsg({ type: 'err', text: 'Ảnh đại diện phải nhỏ hơn 8MB.' });
      e.target.value = '';
      return;
    }

    setUploading(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const data = await api.upload('/api/upload/avatar', fd);
      setForm((f) => ({ ...f, avatar: data.avatar }));
      setMsg({ type: 'ok', text: 'Đã cập nhật avatar.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 rounded-full border-2 border-cyan-500/40 border-t-cyan-600 dark:border-accent/30 dark:border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white mb-2">
        Hồ sơ công khai
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Thông tin hiển thị trên trang chủ (user admin đầu tiên). Upload avatar — trước đó sẽ hiện chữ
        cái.
      </p>

      <div className="flex flex-col sm:flex-row gap-8 mb-10 items-start">
        <div>
          <AvatarDisplay name={form.name} avatar={form.avatar} size={120} />
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-slate-200/90 text-sm text-slate-800 hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
              className="sr-only"
              onChange={onAvatarChange}
              disabled={uploading}
            />
            {uploading ? 'Đang tải…' : 'Tải ảnh lên'}
          </label>
          {form.avatar && (
            <p className="text-xs text-slate-500 mt-2 break-all">{assetUrl(form.avatar)}</p>
          )}
        </div>
      </div>

      <form onSubmit={save} className="space-y-5 glass rounded-2xl p-8">
        <label className="block">
          <span className="text-xs text-slate-500 uppercase">Tên</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:bg-surface-900/80 dark:border-white/10 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500 uppercase">Chức danh</span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:bg-surface-900/80 dark:border-white/10 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500 uppercase">Giới thiệu</span>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 resize-none dark:bg-surface-900/80 dark:border-white/10 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500 uppercase">Facebook URL</span>
          <input
            value={form.facebook}
            onChange={(e) => setForm({ ...form, facebook: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:bg-surface-900/80 dark:border-white/10 dark:text-white"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500 uppercase">TikTok URL</span>
          <input
            value={form.tiktok}
            onChange={(e) => setForm({ ...form, tiktok: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 dark:bg-surface-900/80 dark:border-white/10 dark:text-white"
          />
        </label>
        <div className="rounded-2xl border border-slate-200/90 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase">Cài đặt trang chủ</p>
              <h2 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                Nhạc nền
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Phát nhạc ambient nhẹ ở trang chủ. Người xem vẫn có thể tự bật hoặc tắt.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.backgroundMusicEnabled}
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  backgroundMusicEnabled: !current.backgroundMusicEnabled,
                }))
              }
              className={`inline-flex h-7 w-14 items-center rounded-full border transition-colors ${
                form.backgroundMusicEnabled
                  ? 'border-cyan-500/70 bg-gradient-to-r from-cyan-500 to-violet-600'
                  : 'border-slate-300 bg-slate-300/80 dark:border-white/10 dark:bg-white/10'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  form.backgroundMusicEnabled ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        {msg && (
          <p className={msg.type === 'ok' ? 'text-emerald-400 text-sm' : 'text-red-400 text-sm'}>
            {msg.text}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold disabled:opacity-50"
        >
          {saving ? 'Đang lưu…' : 'Lưu hồ sơ'}
        </button>
      </form>
    </div>
  );
}
