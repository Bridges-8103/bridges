import type { Role, VerificationStatus } from "@prisma/client";

export interface AdminOverview {
  totalUsers: number;
  openReports: number;
  weeklyMeetings: number;
  cancelledMeetings: number;
  activeStudentsCount: number;
  activeMentorsCount: number;
  topStudents: { id: number; name: string; email: string; meetingCount: number }[];
  topMentors: {
    id: number;
    name: string;
    email: string;
    specialty: string | null;
    attendedCount: number;
  }[];
  inactiveStudentCount: number;
  inactiveMentorCount: number;
  inactiveStudents: { id: number; name: string; email: string; joinedDate: string }[];
  inactiveMentors: { id: number; name: string; email: string; specialty: string | null }[];
}

export interface ListUsersFilters {
  q?: string;
  role?: Role;
}

export interface AdminUserRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  isSuspended: boolean;
  verificationStatus: VerificationStatus;
  openReports: number;
  joinedDate: string;
}

export interface AdminReportRow {
  id: number;
  reason: string;
  status: string;
  createdAt: string;
  reportedUser: { id: number; name: string; email: string; isSuspended: boolean; role: Role };
  reporter: { id: number; name: string; email: string } | null;
}
