const MOCK_REPORTS = [
  {
    id: 'rep_101',
    reportedUser: 'John Doe',
    reporter: 'Alice Smith',
    reason: 'Inappropriate content in post',
    status: 'OPEN',
    createdAt: '2026-09-15',
  },
  {
    id: 'rep_102',
    reportedUser: 'BadActor99',
    reporter: 'Bob Wilson',
    reason: 'Spam / Automated bot activity',
    status: 'OPEN',
    createdAt: '2026-09-14',
  },
  {
    id: 'rep_103',
    reportedUser: 'User_404',
    reporter: 'Charlie Brown',
    reason: 'Harassment in direct messages',
    status: 'RESOLVED',
    createdAt: '2026-09-10',
  },
];

export default async function ReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Reports & Moderation</h1>
        <span className="text-xs font-semibold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
          2 Pending Action
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_REPORTS.map((report) => (
              <tr key={report.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-900">{report.reportedUser}</td>
                <td className="px-6 py-4">{report.reporter}</td>
                <td className="px-6 py-4">{report.reason}</td>
                <td className="px-6 py-4 text-xs text-slate-500">{report.createdAt}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      report.status === 'OPEN'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}