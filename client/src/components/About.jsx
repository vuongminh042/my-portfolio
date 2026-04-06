import { motion } from 'framer-motion';
import SectionTitle from './SectionTitle';

export default function About({ profile }) {
  const name = profile?.name || 'Developer';
  const bio =
    profile?.bio ||
    '';

  return (
    <section id="about" className="py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          eyebrow="Giới thiệu"
          title="Về mình"
          subtitle="Kết hợp thẩm mỹ và kỹ thuật để tạo sản phẩm web chất lượng."
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="glass rounded-3xl p-8 md:p-12 max-w-4xl mx-auto"
        >
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            Chào bạn, mình là <span className="text-slate-900 dark:text-white font-medium">{name}</span>
            . {bio}
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-6">
            {[
              { n: 'MERN', d: 'MongoDB, Express, React, Node' },
              { n: 'UI/UX', d: 'Motion, responsive, dark mode' },
              { n: 'Admin', d: 'Quản lý dự án, skill, tin nhắn' },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl bg-slate-100/90 p-5 border border-slate-200/80 dark:bg-white/5 dark:border-white/5"
              >
                <div className="font-display font-semibold text-cyan-600 dark:text-accent mb-1">
                  {item.n}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-500">{item.d}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
