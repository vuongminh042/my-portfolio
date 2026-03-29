import { motion } from 'framer-motion';
import AvatarDisplay from './AvatarDisplay';

export default function Hero({ profile }) {
  const title = profile?.title || 'Frontend Developer';
  const name = profile?.name || 'Tên của bạn';
  const bio =
    profile?.bio ||
    '';

  return (
    <section className="relative min-h-screen flex items-center pt-28 pb-16 px-4 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
        <div className="order-2 lg:order-1">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-accent font-medium tracking-wide uppercase text-sm mb-4"
          >
            Portfolio · MERN
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6"
          >
            Xin chào, mình là{' '}
            <span className="text-gradient block sm:inline mt-2 sm:mt-0">{name}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-xl text-cyan-800 dark:text-cyan-200/80 font-display font-medium mb-6"
          >
            {title}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-xl mb-10"
          >
            {bio}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap gap-4"
          >
            <a
              href="#projects"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
            >
              Xem dự án
            </a>
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl glass text-slate-800 font-medium hover:bg-slate-100/80 dark:text-white dark:hover:bg-white/10 transition-colors"
            >
              Liên hệ
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-12 flex flex-wrap items-center gap-3"
          >
            {profile?.facebook && (
              <a
                href={profile.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-[#1877F2] shadow-sm transition hover:scale-105 hover:bg-white hover:shadow-md dark:border-white/15 dark:bg-white/10 dark:text-[#1877F2] dark:hover:bg-white/15"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
            {profile?.tiktok && (
              <a
                href={profile.tiktok}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 text-slate-900 shadow-sm transition hover:scale-105 hover:bg-white hover:shadow-md dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
            )}
          </motion.div>
        </div>

        <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
          <div className="relative">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <AvatarDisplay name={name} avatar={profile?.avatar} size={280} />
            </motion.div>
            <motion.div
              className="absolute -z-10 inset-0 scale-110 rounded-full border border-cyan-400/40 dark:border-cyan-500/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
