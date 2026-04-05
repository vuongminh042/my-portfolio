import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ConfirmModal({
  open,
  title,
  description,
  details,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape' && !loading) onCancel?.();
    }

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Đóng hộp thoại xác nhận"
        onClick={() => {
          if (!loading) onCancel?.();
        }}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md dark:bg-slate-950/72"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-xl overflow-hidden rounded-[30px] border border-slate-200/90 bg-white/95 p-6 shadow-2xl shadow-slate-950/20 backdrop-blur-xl dark:border-cyan-400/15 dark:bg-slate-950 dark:shadow-black/70 dark:backdrop-blur-none sm:p-7"
      >
        <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-violet-500/80" />
        <div className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_left,rgba(168,85,247,0.10),transparent_26%),linear-gradient(180deg,rgba(9,14,28,0.96),rgba(3,7,18,0.98))]" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-gradient-to-br from-cyan-500/18 to-violet-500/18 blur-3xl dark:from-cyan-500/14 dark:to-violet-500/12" />

        <div className="relative">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/18 to-orange-500/18 text-red-500 shadow-lg shadow-red-500/10 dark:border-red-400/20 dark:from-red-500/18 dark:to-orange-500/12 dark:text-red-300">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
                <path
                  d="M12 8v5m0 3.25h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-200">
                Xác nhận thao tác
              </p>
              <h2
                id="confirm-modal-title"
                className="mt-2 font-display text-2xl font-bold text-slate-900 dark:text-slate-50"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300/95">
                  {description}
                </p>
              )}
            </div>
          </div>

          {details && (
            <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-100/80 p-4 text-sm text-slate-700 dark:border-cyan-400/10 dark:bg-slate-900/90 dark:text-slate-200">
              {details}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="rounded-2xl bg-gradient-to-r from-red-500 via-rose-500 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang xử lý…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
