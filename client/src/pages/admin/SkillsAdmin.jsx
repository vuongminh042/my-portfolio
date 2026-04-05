import { useEffect, useState } from 'react';
import api from '../../api';
import ConfirmModal from '../../components/ConfirmModal';

const empty = { name: '', level: 80, category: 'frontend', order: 0 };

export default function SkillsAdmin() {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [msg, setMsg] = useState(null);
  const [confirmSkill, setConfirmSkill] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  async function load() {
    const data = await api.get('/api/skills');
    setList(data);
  }

  useEffect(() => {
    load().catch(() => setMsg({ type: 'err', text: 'Không tải được kỹ năng' }));
  }, []);

  function startCreate() {
    setEditing('new');
    setForm(empty);
  }

  function startEdit(s) {
    setEditing(s._id);
    setForm({
      name: s.name,
      level: s.level,
      category: s.category || 'general',
      order: s.order ?? 0,
    });
  }

  async function save(e) {
    e.preventDefault();
    setMsg(null);
    const payload = {
      name: form.name,
      level: Math.min(100, Math.max(0, Number(form.level) || 0)),
      category: form.category,
      order: Number(form.order) || 0,
    };
    try {
      if (editing === 'new') {
        await api.post('/api/skills', payload);
        setMsg({ type: 'ok', text: 'Đã thêm.' });
      } else {
        await api.patch(`/api/skills/${editing}`, payload);
        setMsg({ type: 'ok', text: 'Đã cập nhật.' });
      }
      setEditing(null);
      setForm(empty);
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    }
  }

  async function confirmRemoveSkill() {
    if (!confirmSkill) return;
    try {
      setRemovingId(confirmSkill._id);
      await api.delete(`/api/skills/${confirmSkill._id}`);
      setConfirmSkill(null);
      await load();
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Kỹ năng</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Thanh tiến trình trên trang chủ
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="px-5 py-2.5 rounded-xl bg-cyan-500/15 text-cyan-800 font-medium hover:bg-cyan-500/25 dark:bg-accent/20 dark:text-accent dark:hover:bg-accent/30"
        >
          + Thêm
        </button>
      </div>

      {msg && (
        <p className={`mb-4 text-sm ${msg.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
          {msg.text}
        </p>
      )}

      {editing !== null && (
        <form onSubmit={save} className="glass rounded-2xl p-6 mb-10 space-y-4 max-w-lg">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {editing === 'new' ? 'Kỹ năng mới' : 'Sửa'}
          </h2>
          <label className="block text-sm">
            <span className="text-slate-500">Tên</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Mức (0–100)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Nhóm</span>
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-500">Thứ tự</span>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:bg-surface-900 dark:border-white/10 dark:text-white"
            />
          </label>
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

      <div className="space-y-2">
        {list.map((s) => (
          <div
            key={s._id}
            className="flex items-center justify-between gap-4 glass rounded-xl px-4 py-3"
          >
            <div>
              <span className="text-slate-900 dark:text-white font-medium">{s.name}</span>
              <span className="text-slate-500 text-sm ml-3">
                {s.level}% · {s.category}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(s)}
                className="px-3 py-1.5 rounded-lg bg-slate-200/90 text-sm text-slate-800 dark:bg-white/10 dark:text-white"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => setConfirmSkill(s)}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 text-sm text-red-400"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={Boolean(confirmSkill)}
        title="Xóa kỹ năng này?"
        description="Kỹ năng sẽ biến mất khỏi trang chủ và khỏi danh sách quản trị ngay sau khi xác nhận."
        details={
          confirmSkill && (
            <div className="space-y-2">
              <p className="font-medium text-slate-900 dark:text-white">{confirmSkill.name}</p>
              <p className="text-slate-600 dark:text-slate-300">
                {confirmSkill.level}% · {confirmSkill.category}
              </p>
            </div>
          )
        }
        confirmLabel="Xóa kỹ năng"
        cancelLabel="Hủy"
        onCancel={() => {
          if (!removingId) setConfirmSkill(null);
        }}
        onConfirm={() => {
          confirmRemoveSkill().catch(() => {});
        }}
        loading={Boolean(confirmSkill && removingId === confirmSkill._id)}
      />
    </div>
  );
}
