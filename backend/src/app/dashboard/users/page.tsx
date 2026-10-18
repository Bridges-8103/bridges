import Link from 'next/link';
import { Role } from '@prisma/client';
import { requireAdminPage } from '@/lib/adminAuth';
import { AdminService } from '@/modules/admin/admin.service';
import SuspendButton from '@/components/pages/dashboard/SuspendButton';
import { formatDate } from '@/utils/formatDate';

export const dynamic = 'force-dynamic';

const ROLE_FILTERS: { label: string; value?: Role }[] = [
  { label: 'All' },
  { label: 'Students', value: Role.STUDENT },
  { label: 'Mentors', value: Role.MENTOR },
  { label: 'Admins', value: Role.ADMIN },
];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  await requireAdminPage();

  const { q, role } = await searchParams;
  const roleFilter = Object.values(Role).find((r) => r === role);
  const query = q?.trim() || undefined;

  const { users, total } = await AdminService.listUsers({ q: query, role: roleFilter });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Showing {users.length} of {total} user{total === 1 ? '' : 's'}
          </p>
        </div>

        <form action="/dashboard/users" className="flex items-center gap-2">
          {roleFilter ? <input type="hidden" name="role" value={roleFilter} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search name or email…"
            className="w-64 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex gap-2">
        {ROLE_FILTERS.map((f) => {
          const active = f.value === roleFilter;
          const params = new URLSearchParams();
          if (f.value) params.set('role', f.value);
          if (query) params.set('q', query);
          const qs = params.toString();

          return (
            <Link
              key={f.label}
              href={qs ? `/dashboard/users?${qs}` : '/dashboard/users'}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
                active
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Email</th>
              <th className="px-6 py-3 font-semibold">Role</th>
              <th className="px-6 py-3 font-semibold">Joined</th>
              <th className="px-6 py-3 font-semibold">Open Reports</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                  No users match your filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4 capitalize">{user.role.toLowerCase()}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {formatDate(user.joinedDate, 'en-US', { month: 'short' })}
                  </td>
                  <td className="px-6 py-4">
                    {user.openReports > 0 ? (
                      <span className="font-semibold text-rose-600">{user.openReports}</span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        user.isSuspended ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {user.isSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.role === Role.ADMIN ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <SuspendButton userId={user.id} isSuspended={user.isSuspended} />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
