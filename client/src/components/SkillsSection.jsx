import { motion } from 'framer-motion';
import SectionTitle from './SectionTitle';

export default function SkillsSection({ skills }) {
  const list = skills || [];
  const empty = list.length === 0;

  return (
    <section id="skills" className="py-24 px-4 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 dark:via-cyan-500/30 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Stack"
          title="Kỹ năng"
          subtitle=""
        />
        {empty && (
          <p className="text-center text-slate-600 dark:text-slate-500 py-8">
            Chưa có kỹ năng nào!
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-5">
          {list.map((s, i) => (
            <motion.div
              key={s._id || i}
              initial={{ opacity: 0, x: i % 2 ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-slate-900 dark:text-white">{s.name}</span>
                <span className="text-sm text-slate-500">{s.level}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-surface-700 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${s.level}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              {s.category && (
                <p className="mt-2 text-xs text-slate-500 uppercase tracking-wider">{s.category}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
