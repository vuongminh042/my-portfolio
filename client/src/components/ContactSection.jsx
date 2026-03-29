import { motion } from 'framer-motion';
import { useState } from 'react';
import api from '../api';
import SectionTitle from './SectionTitle';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', body: '' });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      await api.post('/api/messages', form);
      setStatus({ type: 'ok', text: 'Đã gửi — mình sẽ phản hồi sớm.' });
      setForm({ name: '', email: '', subject: '', body: '' });
    } catch (err) {
      setStatus({ type: 'err', text: err.message || 'Gửi thất bại' });
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="py-24 px-4 pb-32">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Liên hệ"
          title="Nói chuyện với mình"
          subtitle=""
        />
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto glass rounded-3xl p-8 space-y-5"
        >
          <div className="grid sm:grid-cols-2 gap-5">
            <label className="block">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Tên</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl border px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:bg-surface-900/80 dark:border-white/10 dark:text-white dark:focus:ring-accent/50 bg-white border-slate-200"
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-xl border px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:bg-surface-900/80 dark:border-white/10 dark:text-white dark:focus:ring-accent/50 bg-white border-slate-200"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Chủ đề</span>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:bg-surface-900/80 dark:border-white/10 dark:text-white dark:focus:ring-accent/50"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Nội dung</span>
            <textarea
              required
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 dark:bg-surface-900/80 dark:border-white/10 dark:text-white dark:focus:ring-accent/50 resize-none"
            />
          </label>
          {status && (
            <p
              className={`text-sm ${status.type === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}
            >
              {status.text}
            </p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold disabled:opacity-50 hover:opacity-95 transition-opacity"
          >
            {sending ? 'Đang gửi…' : 'Gửi tin nhắn'}
          </button>
        </motion.form>
      </div>
    </section>
  );
}
