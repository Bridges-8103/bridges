import { SignOutButton } from '@clerk/nextjs';

export default function AccessDeniedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4">
      <div className="text-4xl">🔒</div>
      <h1 className="text-2xl font-bold text-slate-800">Admin access required</h1>
      <p className="text-sm text-slate-500 max-w-md">
        Your account doesn&apos;t have permission to use the Bridges admin portal. Ask an existing
        administrator to grant you the <code className="font-mono">ADMIN</code> role, then sign in again.
      </p>
      <SignOutButton redirectUrl="/sign-in">
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-700">
          Sign out
        </button>
      </SignOutButton>
    </div>
  );
}
