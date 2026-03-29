import { motion } from 'framer-motion';
import { assetUrl } from '../api';
import SectionTitle from './SectionTitle';

export default function ProjectsSection({ projects }) {
  const list = projects || [];
  const empty = list.length === 0;

  return (
    <section id="projects" className="py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Portfolio"
          title="Dự án nổi bật"
          subtitle=""
        />
        {empty && (
          <p className="text-center text-slate-600 dark:text-slate-500 py-12 glass rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
            Chưa có dự án!
          </p>
        )}
        <div className="grid md:grid-cols-2 gap-8">
          {list.map((p, i) => (
            <motion.article
              key={p._id || i}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group glass rounded-3xl overflow-hidden border border-slate-200/90 hover:border-cyan-400/50 dark:border-white/10 dark:hover:border-cyan-500/30 transition-colors"
            >
              <div className="aspect-video bg-slate-200 dark:bg-surface-800 relative overflow-hidden">
                {p.image ? (
                  <img
                    src={assetUrl(p.image)}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400 dark:from-surface-700 dark:to-surface-900 flex items-center justify-center">
                    <span className="text-slate-600 dark:text-slate-500 text-sm">Chưa có ảnh</span>
                  </div>
                )}
                {p.featured && (
                  <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-accent/20 text-accent text-xs font-medium">
                    Nổi bật
                  </span>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  {p.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                  {p.description}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(p.tech || []).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-xs text-slate-600 dark:text-slate-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  {p.liveUrl && (
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      Live
                    </a>
                  )}
                  {p.repoUrl && (
                    <a
                      href={p.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                      Code
                    </a>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
