import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Home } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.25),transparent_50%),radial-gradient(circle_at_20%_10%,rgba(203,213,225,0.35),transparent_55%),linear-gradient(135deg,#f8fafc,#eef2f6_55%,#e2e8f0)] font-sans">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.07)_1px,transparent_1px)] bg-[size:30px_30px] opacity-45" />
      <div className="pointer-events-none absolute -top-24 -right-20 h-80 w-80 rounded-full bg-gradient-to-br from-slate-300/40 via-slate-200/30 to-slate-100/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute top-32 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-slate-300/35 via-slate-200/25 to-slate-100/20 blur-3xl animate-[float_12s_ease-in-out_infinite]" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-white/70 shadow-[0_18px_30px_rgba(15,23,42,0.08)] animate-rise">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-8 py-7">
              <Link to="/" className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-slate-300/60 via-slate-200/40 to-slate-100/30 blur" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20 transition-transform group-hover:-translate-y-0.5">
                    <BookOpen className="w-8 h-8" />
                  </div>
                </div>
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.35em] text-slate-500">QU-ready learning stack</p>
                  <h1 className="text-3xl sm:text-4xl font-display font-semibold text-slate-900">QU Lecture Library</h1>
                  <p className="text-base text-slate-600">Transform lectures into Queen's-ready study kits</p>
                </div>
              </Link>

              <nav className="flex items-center gap-3">
                <Link
                  to="/"
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    location.pathname === '/'
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 ring-1 ring-slate-200'
                  }`}
                >
                  <Home className="w-4.5 h-4.5" />
                  <span>Home</span>
                </Link>
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-950/90 text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.25em]">
                  QU Mode
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-rise">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/70 bg-slate-900 text-white/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <p className="text-sm text-white">Ac 2026 QU Lecture Library</p>
              <p className="text-xs text-white/70">Built for students by Queen's Students. Shipping faster with every lecture.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
