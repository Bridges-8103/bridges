'use client';

import { useState, useTransition } from 'react';
import { toggleUserSuspension } from '@/app/dashboard/users/actions';

interface SuspendButtonProps {
  userId: number;
  isSuspended: boolean;
}

export default function SuspendButton({ userId, isSuspended }: SuspendButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    startTransition(async () => {
      const result = await toggleUserSuspension(userId, isSuspended);
      if (!result.success) setError(result.error ?? 'Something went wrong');
      setConfirming(false);
    });
  };

  // Reinstating is low-risk; suspending asks for confirmation first
  if (confirming) {
    return (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={run}
          disabled={isPending}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50"
        >
          {isPending ? 'Suspending…' : 'Confirm'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={isSuspended ? run : () => setConfirming(true)}
        disabled={isPending}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-50 ${
          isSuspended
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
        }`}
      >
        {isPending ? 'Saving…' : isSuspended ? 'Reinstate' : 'Suspend'}
      </button>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
