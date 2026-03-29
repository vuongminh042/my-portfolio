import { motion } from 'framer-motion';
import { assetUrl } from '../api';

export default function AvatarDisplay({ name, avatar, size = 160, className = '' }) {
  const initials = (name || '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hasImage = Boolean(avatar);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-300/50 via-violet-300/30 to-fuchsia-300/40 blur-xl dark:from-cyan-400/30 dark:via-violet-500/20 dark:to-fuchsia-500/30"
        aria-hidden
      />
      <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-slate-200 shadow-2xl shadow-cyan-500/15 dark:border-white/15 dark:shadow-cyan-500/10">
        {!hasImage && (
          <>
            <div
              className="absolute inset-0 bg-gradient-to-br from-slate-200 via-white to-cyan-100 dark:hidden"
              aria-hidden
            />
            <div
              className="absolute inset-0 hidden bg-gradient-to-br from-[#1a2238] via-[#0c101c] to-[#164e63] dark:block"
              aria-hidden
            />
          </>
        )}
        {hasImage ? (
          <img
            src={assetUrl(avatar)}
            alt={name || 'Avatar'}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center font-display text-3xl font-bold text-cyan-700 dark:text-accent-glow/90">
            {initials}
          </div>
        )}
      </div>
    </motion.div>
  );
}
