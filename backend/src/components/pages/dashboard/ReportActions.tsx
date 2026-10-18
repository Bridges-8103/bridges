'use client';

import { useState, useTransition } from 'react';
import { resolveReport } from '@/app/dashboard/reports/actions';

interface ReportActionsProps {
  reportId: number;
  alreadySuspended: boolean;
}

export default function ReportActions({ reportId, alreadySuspended }: ReportActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = (action: 'DISMISS' | 'SUSPEND') => {
    setError(null);
    startTransition(async () => {
      const result = await resolveReport(reportId, action);
      if (!result.success) setError(result.error ?? 'Something went wrong');
      setConfirmSuspend(false);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <button
          onClick={() => run('DISMISS')}
          disabled={isPending}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        >
          Dismiss
        </button>
        {confirmSuspend ? (
          <button
            onClick={() => run('SUSPEND')}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50"
          >
            {isPending ? 'Working…' : 'Confirm suspend'}
          </button>
        ) : (
          <button
            onClick={() => (alreadySuspended ? run('SUSPEND') : setConfirmSuspend(true))}
            disabled={isPending}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 disabled:opacity-50"
          >
            {alreadySuspended ? 'Resolve' : 'Suspend user'}
          </button>
        )}
      </div>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
