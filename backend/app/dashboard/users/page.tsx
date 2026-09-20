const MOCK_USERS = [
  { id: 'usr_1', name: 'Alex Johnson', email: 'alex@example.com', role: 'Admin', status: 'Active' },
  { id: 'usr_2', name: 'Sarah Connor', email: 'sarah@example.com', role: 'User', status: 'Active' },
  { id: 'usr_3', name: 'Michael Scott', email: 'michael@example.com', role: 'User', status: 'Suspended' },
];

export default async function UsersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-800">User Management</h1>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Email</th>
              <th className="px-6 py-3 font-semibold">Role</th>
              <th className="px-6 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">{user.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {user.status}
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