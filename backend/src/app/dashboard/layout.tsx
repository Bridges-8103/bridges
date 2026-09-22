import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import DashboardFooter from '@/components/layout/DashboardFooter';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-wide">Bridges Admin</h2>
          <p className="text-xs text-slate-400 mt-1">Management Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <span>📊</span>
            <span>Overview</span>
          </Link>
          <Link
            href="/dashboard/users"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <span>👥</span>
            <span>User Management</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <span>🚩</span>
            <span>Reports & Moderation</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div className="text-sm font-semibold text-slate-600">
            Admin Workspace
          </div>
          
          {/* Clerk User Profile & Logout Menu */}
          <UserButton showName />
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>

        {/* Development Footer for extracting Bearer token */}
        {process.env.NODE_ENV === 'development' && <DashboardFooter />}
      </div>
    </div>
  );
}