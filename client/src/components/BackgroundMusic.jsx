import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'portfolio.background-music.enabled';
const TRACK_URL = '/audio/gio-thi.mp3';
const DEFAULT_VOLUME = 0.28;

export default function BackgroundMusic({ enabledByAdmin }) {
  const [supported, setSupported] = useState(true);
  const [viewerEnabled, setViewerEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored == null ? true : stored === 'true';
  });
  const [playing, setPlaying] = useState(false);

  const audioRef = useRef(null);
  const activatedRef = useRef(false);

  const startPlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.volume = DEFAULT_VOLUME;
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const stopPlayback = () => {
    const audio = audioRef.current;
    if (!audio) {
      setPlaying(false);
      return;
    }

    audio.pause();
    setPlaying(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined') {
      setSupported(false);
      return undefined;
    }

    const audio = new window.Audio(TRACK_URL);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = DEFAULT_VOLUME;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onError = () => setSupported(false);

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.localStorage.setItem(STORAGE_KEY, String(viewerEnabled));
    return undefined;
  }, [viewerEnabled]);

  useEffect(() => {
    if (!enabledByAdmin || !viewerEnabled) {
      stopPlayback();
      return undefined;
    }

    if (activatedRef.current) {
      startPlayback();
      return undefined;
    }

    const activate = () => {
      activatedRef.current = true;
      startPlayback();
    };

    window.addEventListener('pointerdown', activate, { once: true });
    window.addEventListener('keydown', activate, { once: true });

    return () => {
      window.removeEventListener('pointerdown', activate);
      window.removeEventListener('keydown', activate);
    };
  }, [enabledByAdmin, viewerEnabled]);

  if (!enabledByAdmin || !supported) {
    return null;
  }

  const toggleMusic = async () => {
    activatedRef.current = true;

    if (viewerEnabled) {
      setViewerEnabled(false);
      stopPlayback();
      return;
    }

    setViewerEnabled(true);
    await startPlayback();
  };

  const indicatorClass = viewerEnabled
    ? playing
      ? 'bg-emerald-500 shadow-emerald-500/60'
      : 'bg-amber-400 shadow-amber-400/50'
    : 'bg-slate-400 shadow-slate-400/40 dark:bg-slate-500';

  return (
    <button
      type="button"
      aria-pressed={viewerEnabled}
      title="Nhạc nền: Giờ Thì"
      onClick={toggleMusic}
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-3 rounded-full border border-slate-200/90 bg-white/90 px-4 py-3 text-sm font-medium text-slate-800 shadow-lg shadow-slate-900/5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white dark:border-white/10 dark:bg-surface-800/80 dark:text-white dark:hover:bg-surface-800"
    >
      <span className={`h-2.5 w-2.5 rounded-full shadow-[0_0_14px] ${indicatorClass}`} />
      <span>{viewerEnabled ? 'Tắt nhạc nền' : 'Bật nhạc nền'}</span>
      <svg className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M14 3.23v17.54a2 2 0 0 1-3.41 1.42l-3.17-3.19H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h3.42l3.17-3.19A2 2 0 0 1 14 3.23Zm3.54 4.05a1 1 0 1 1 1.41 1.41A4.98 4.98 0 0 1 20.5 12a4.98 4.98 0 0 1-1.55 3.31 1 1 0 1 1-1.41-1.41A3 3 0 0 0 18.5 12a3 3 0 0 0-.96-2.72Zm2.83-2.83a1 1 0 0 1 1.41 0A9 9 0 0 1 24 12a9 9 0 0 1-2.22 5.55 1 1 0 0 1-1.41-1.41A7 7 0 0 0 22 12a7 7 0 0 0-1.63-4.14 1 1 0 0 1 0-1.41Z" />
      </svg>
    </button>
  );
}
