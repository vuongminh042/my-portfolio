import { useEffect, useState } from 'react';
import api, { assetUrl } from '../../api';
import ConfirmModal from '../../components/ConfirmModal';

const empty = {
  title: '',
  description: '',
  image: '',
  tech: '',
  liveUrl: '',
  repoUrl: '',
  featured: false,
  order: 0,
};

export default function ProjectsAdmin() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmProject, setConfirmProject] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  async function load() {
    const data = await api.get('/api/projects');
    setList(data);
  }

  useEffect(() => {
    load().catch(() => setMsg({ type: 'err', text: 'Không tải được dự án' }));
  }, []);

  function startCreate() {
    setEditing('new');
    setForm(empty);
  }

  function startEdit(p) {
    setEditing(p._id);
    setForm({
      title: p.title,
      description: p.description || '',
      image: p.image || '',
      tech: (p.tech || []).join(', '),
      liveUrl: p.liveUrl || '',
      repoUrl: p.repoUrl || '',
      featured: !!p.featured,
      order: p.order ?? 0,
    });
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    const payload = {
      title: form.title,
      description: form.description,
      image: form.image,
      tech: form.tech
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      liveUrl: form.liveUrl,
      repoUrl: form.repoUrl,
      featured: form.featured,
      order: Number(form.order) || 0,
    };
    try {
      if (editing === 'new') {
        await api.post('/api/projects', payload);
        setMsg({ type: 'ok', text: 'Đã tạo dự án.' });
      } else {
        await api.patch(`/api/projects/${editing}`, payload);
        setMsg({ type: 'ok', text: 'Đã cập nhật.' });
      }
      setEditing(null);
      setForm(empty);
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
  }

  async function confirmRemoveProject() {
    if (!confirmProject) return;
    try {
      setRemovingId(confirmProject._id);
      await api.delete(`/api/projects/${confirmProject._id}`);
      setConfirmProject(null);
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setRemovingId(null);
    }
  }

  async function onImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const data = await api.upload('/api/upload/project', fd);
      setForm((f) => ({ ...f, image: data.image }));
      setMsg({ type: 'ok', text: 'Đã tải ảnh — nhấn Lưu để gắn vào dự án.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Dự án</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">CRUD + upload ảnh cover</p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="px-5 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-800 font-medium hover:bg-cyan-500/25 dark:bg-accent/20 dark:text-accent dark:hover:bg-accent/30"
        >
          + Thêm dự án
        </button>
      </div>

      {msg && (
        <p className={`mb-4 text-sm ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg.text}
        </p>
      )}

      {(editing !== null) && (
        <form
          onSubmit={save}
          className="glass rounded-2xl p-6 mb-10 space-y-4 max-w-2xl"
        >
          <h2 className="font-semibold text-slate-900 dark:text-white mb-2">
            {editing === 'new' ? 'Dự án mới' : 'Sửa dự án'}
          </h2>
          <label className="block text-sm">
            <span className="text-slate-500">Tiêu đề</span>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Mô tả</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
            />
          </label>
          <div>
            <span className="text-slate-500 text-sm">Ảnh cover</span>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {form.image && (
                <img
                  src={assetUrl(form.image)}
                  alt=""
                  className="h-20 w-32 object-cover rounded-lg border border-slate-200 dark:border-white/10"
                />
              )}
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-200/90 text-sm text-slate-800 dark:bg-white/10 dark:text-slate-200">
                {uploading ? '…' : 'Upload ảnh'}
                <input type="file" accept="image/*" className="hidden" onChange={onImageFile} />
              </label>
              <input
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="/uploads/projects/..."
                className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 text-xs dark:bg-surface-900 dark:border-white/10 dark:text-white"
              />
            </div>
          </div>
          <label className="block text-sm">
            <span className="text-slate-500">Tech (cách nhau bởi dấu phẩy)</span>
            <input
              value={form.tech}
              onChange={(e) => setForm({ ...form, tech: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-slate-500">Live URL</span>
              <input
                value={form.liveUrl}
                onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-500">Repo URL</span>
              <input
                value={form.repoUrl}
                onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-6 items-center">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Nổi bật
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Thứ tự</span>
              <input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
              />
            </label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-medium"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
              className="px-6 py-2 rounded-xl bg-slate-200/90 text-slate-800 dark:bg-white/10 dark:text-white"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {list.map((p) => (
          <div
            key={p._id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass rounded-xl p-4"
          >
            <div className="flex gap-4 min-w-0">
              <div className="w-24 h-16 rounded-lg bg-surface-800 overflow-hidden shrink-0">
                {p.image ? (
                  <img src={assetUrl(p.image)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                    No img
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{p.title}</p>
                <p className="text-xs text-slate-500 truncate">{p.description}</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => startEdit(p)}
                className="px-4 py-2 rounded-lg bg-slate-200/90 text-sm text-slate-800 dark:bg-white/10 dark:text-white"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => setConfirmProject(p)}
                className="px-4 py-2 rounded-lg bg-red-500/15 text-sm text-red-400"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-slate-500 text-sm">Chưa có dự án — nhấn &quot;Thêm dự án&quot;.</p>
        )}
      </div>

      <ConfirmModal
        open={Boolean(confirmProject)}
        title="Xóa dự án khỏi portfolio?"
        description="Nếu xác nhận, dự án này sẽ bị gỡ khỏi trang chủ và khỏi khu vực quản trị."
        details={
          confirmProject && (
            <div className="flex items-center gap-4">
              <div className="h-16 w-24 overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200 dark:border-white/10 dark:bg-white/5">
                {confirmProject.image ? (
                  <img
                    src={assetUrl(confirmProject.image)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">
                    No img
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900 dark:text-white">
                  {confirmProject.title}
                </p>
                <p className="mt-1 max-h-11 overflow-hidden text-sm text-slate-600 dark:text-slate-300">
                  {confirmProject.description || 'Chưa có mô tả'}
                </p>
              </div>
            </div>
          )
        }
        confirmLabel="Xóa dự án"
        cancelLabel="Giữ lại"
        onCancel={() => {
          if (!removingId) setConfirmProject(null);
        }}
        onConfirm={() => {
          confirmRemoveProject().catch(() => {});
        }}
        loading={Boolean(confirmProject && removingId === confirmProject._id)}
      />
    </div>
  );
}
