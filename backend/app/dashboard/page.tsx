// Mock data for overall platform metrics and meeting stats
const MOCK_PLATFORM_STATS = {
  totalUsers: 128,
  openReports: 4,
  weeklyMeetings: 42,
  cancelledMeetings: 5,
  activeStudentsCount: 28,
  activeMentorsCount: 12,
};

const MOCK_STUDENT_MEETINGS = [
  { id: 'st_1', name: 'Alex Johnson', email: 'alex@example.com', meetingCount: 5 },
  { id: 'st_2', name: 'Sarah Connor', email: 'sarah@example.com', meetingCount: 4 },
  { id: 'st_3', name: 'David Lee', email: 'david@example.com', meetingCount: 3 },
  { id: 'st_4', name: 'Emma Watson', email: 'emma@example.com', meetingCount: 2 },
];

const MOCK_MENTOR_MEETINGS = [
  { id: 'mn_1', name: 'Dr. Robert Ford', email: 'robert@example.com', attendedCount: 12, specialty: 'System Architecture' },
  { id: 'mn_2', name: 'Elena Rostova', email: 'elena@example.com', attendedCount: 9, specialty: 'Frontend & UI/UX' },
  { id: 'mn_3', name: 'Marcus Aurelius', email: 'marcus@example.com', attendedCount: 7, specialty: 'Cloud Security' },
];

const MOCK_INACTIVE_STUDENTS = [
  { id: 'st_10', name: 'Michael Scott', email: 'michael@example.com', joinedDate: '2026-09-01' },
  { id: 'st_11', name: 'Jim Halpert', email: 'jim@example.com', joinedDate: '2026-09-05' },
  { id: 'st_12', name: 'Pam Beesly', email: 'pam@example.com', joinedDate: '2026-09-10' },
];

const MOCK_INACTIVE_MENTORS = [
  { id: 'mn_10', name: 'Dwight Schrute', email: 'dwight@example.com', specialty: 'DevOps' },
  { id: 'mn_11', name: 'Angela Martin', email: 'angela@example.com', specialty: 'Data Science' },
];

export default async function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Weekly platform activity, meeting statistics, and engagement insights.
        </p>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Users */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Users
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            {MOCK_PLATFORM_STATS.totalUsers}
          </p>
        </div>

        {/* Open Reports */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Open Reports
          </p>
          <p className="text-3xl font-bold text-rose-600 mt-2">
            {MOCK_PLATFORM_STATS.openReports}
          </p>
        </div>

        {/* Weekly Meetings */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Meetings This Week
          </p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {MOCK_PLATFORM_STATS.weeklyMeetings}
          </p>
        </div>

        {/* Cancelled Meetings */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Cancelled
          </p>
          <p className="text-3xl font-bold text-amber-600 mt-2">
            {MOCK_PLATFORM_STATS.cancelledMeetings}
          </p>
        </div>

        {/* Active Students */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Students
          </p>
          <p className="text-3xl font-bold text-teal-600 mt-2">
            {MOCK_PLATFORM_STATS.activeStudentsCount}
          </p>
        </div>

        {/* Active Mentors */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Mentors
          </p>
          <p className="text-3xl font-bold text-cyan-600 mt-2">
            {MOCK_PLATFORM_STATS.activeMentorsCount}
          </p>
        </div>
      </div>

      {/* Meeting Activity Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Meetings Count */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">
              Student Meeting Activity
            </h2>
            <span className="text-xs text-slate-400">Top Students</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Student</th>
                <th className="px-5 py-3 font-semibold text-right">Meetings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {MOCK_STUDENT_MEETINGS.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-slate-400">{student.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-indigo-600">
                    {student.meetingCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mentor Attended Meetings Count */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">
              Mentor Attended Meetings
            </h2>
            <span className="text-xs text-slate-400">Most Active Mentors</span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Mentor</th>
                <th className="px-5 py-3 font-semibold">Domain</th>
                <th className="px-5 py-3 font-semibold text-right">Attended</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {MOCK_MENTOR_MEETINGS.map((mentor) => (
                <tr key={mentor.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{mentor.name}</div>
                    <div className="text-xs text-slate-400">{mentor.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {mentor.specialty}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-teal-600">
                    {mentor.attendedCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inactive Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students with 0 Meetings */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Students with No Meetings
            </h2>
            <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
              {MOCK_INACTIVE_STUDENTS.length} Inactive
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Student Name</th>
                <th className="px-5 py-3 font-semibold">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {MOCK_INACTIVE_STUDENTS.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">
                      {student.name}
                    </div>
                    <div className="text-xs text-slate-400">{student.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {student.joinedDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mentors with 0 Meetings Attended */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Mentors with No Meetings Attended
            </h2>
            <span className="text-xs bg-rose-50 text-rose-700 font-semibold px-2.5 py-1 rounded-full border border-rose-200">
              {MOCK_INACTIVE_MENTORS.length} Inactive
            </span>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Mentor Name</th>
                <th className="px-5 py-3 font-semibold">Specialty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {MOCK_INACTIVE_MENTORS.map((mentor) => (
                <tr key={mentor.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-900">{mentor.name}</div>
                    <div className="text-xs text-slate-400">{mentor.email}</div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {mentor.specialty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}