export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 py-10 px-4">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-600 dark:text-slate-500">
        <p>© {new Date().getFullYear()} My Portfolio </p>
        <p>Vương Chí Minh</p>
      </div>
    </footer>
  );
}
