import { requireAdminPage } from '@/lib/adminAuth';
import { AdminService } from '@/modules/admin/admin.service';
import ReportActions from '@/components/pages/dashboard/ReportActions';
import { formatDate } from '@/utils/formatDate';

export const dynamic = 'force-dynamic';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  OPEN: { label: 'Open', className: 'bg-red-100 text-red-700' },
  DISMISSED: { label: 'Dismissed', className: 'bg-slate-100 text-slate-600' },
  RESOLVED_SUSPENDED: { label: 'User suspended', className: 'bg-amber-100 text-amber-700' },
};

export default async function ReportsPage() {
  await requireAdminPage();

  const reports = await AdminService.listReports();
  const openCount = reports.filter((r) => r.status === 'OPEN').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Reports & Moderation</h1>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            openCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'
          }`}
        >
          {openCount > 0 ? `${openCount} Pending Action` : 'All caught up'}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Reported User</th>
              <th className="px-6 py-3 font-semibold">Reported By</th>
              <th className="px-6 py-3 font-semibold">Reason</th>
              <th className="px-6 py-3 font-semibold">Date</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  No reports have been filed.
                </td>
              </tr>
            ) : (
              reports.map((report) => {
                const status = STATUS_STYLES[report.status] ?? {
                  label: report.status,
                  className: 'bg-slate-100 text-slate-600',
                };

                return (
                  <tr key={report.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{report.reportedUser.name}</div>
                      <div className="text-xs text-slate-400">
                        {report.reportedUser.email}
                        {report.reportedUser.isSuspended ? ' · suspended' : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {report.reporter ? (
                        <>
                          <div>{report.reporter.name}</div>
                          <div className="text-xs text-slate-400">{report.reporter.email}</div>
                        </>
                      ) : (
                        <span className="text-slate-400">Deleted user</span>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-xs whitespace-pre-wrap break-words">{report.reason}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {formatDate(report.createdAt, 'en-US', { month: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.status === 'OPEN' ? (
                        <ReportActions
                          reportId={report.id}
                          alreadySuspended={report.reportedUser.isSuspended}
                        />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
