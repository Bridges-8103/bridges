import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const { userId } = await auth();

  // If already logged in, send them straight to the admin dashboard
  if (userId) {
    redirect('/dashboard/users');
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Header Bar */}
      <header className="flex items-center justify-between px-8 py-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌉</span>
          <span className="text-xl font-bold tracking-wide">Bridges Admin</span>
        </div>
        <Link
          href="/sign-in"
          className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          Sign In
        </Link>
      </header>

      {/* Hero Welcome Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold mb-6 border border-indigo-500/20">
          🔒 Secure Management Portal
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight max-w-2xl text-slate-100">
          Welcome to Bridges Admin Portal
        </h1>
        
        <p className="mt-4 text-lg text-slate-400 max-w-lg">
          Manage platform users, inspect moderation reports, and view system metrics securely.
        </p>

        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/sign-in"
            className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/30 transition"
          >
            Access Admin Workspace →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-800">
        © {new Date().getFullYear()} Bridges. Internal Access Only.
      </footer>
    </div>
  );
}