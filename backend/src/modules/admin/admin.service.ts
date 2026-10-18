import { prisma } from "@/lib/prisma";
import { BookingStatus, Role, type Prisma } from "@prisma/client";
import type {
  AdminOverview,
  AdminReportRow,
  AdminUserRow,
  ListUsersFilters,
} from "./admin.types";

/** Bookings that count as a real meeting for dashboard statistics. */
const MEETING_STATUSES = [BookingStatus.CONFIRMED, BookingStatus.COMPLETED];

const TOP_LIST_SIZE = 5;
const INACTIVE_LIST_SIZE = 10;
const USERS_PAGE_SIZE = 100;

/** Monday 00:00 of the current week (server time) through the following Monday. */
function currentWeekRange(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export class AdminService {
  static async getOverview(): Promise<AdminOverview> {
    const { start, end } = currentWeekRange();
    const slotThisWeek = { startTime: { gte: start, lt: end } };

    const [
      totalUsers,
      openReports,
      weeklyMeetings,
      cancelledMeetings,
      studentGroups,
      mentorGroups,
      inactiveStudentCount,
      inactiveMentorCount,
      inactiveStudents,
      inactiveMentors,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { not: Role.ADMIN } } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.sessionBooking.count({
        where: { status: { in: MEETING_STATUSES }, slot: slotThisWeek },
      }),
      prisma.sessionBooking.count({
        where: { status: BookingStatus.CANCELLED, slot: slotThisWeek },
      }),
      prisma.sessionBooking.groupBy({
        by: ["studentId"],
        where: { status: { in: MEETING_STATUSES } },
        _count: { _all: true },
        orderBy: { _count: { studentId: "desc" } },
      }),
      prisma.sessionBooking.groupBy({
        by: ["mentorId"],
        where: { status: { in: MEETING_STATUSES } },
        _count: { _all: true },
        orderBy: { _count: { mentorId: "desc" } },
      }),
      prisma.user.count({
        where: { role: Role.STUDENT, studentBookings: { none: { status: { in: MEETING_STATUSES } } } },
      }),
      prisma.user.count({
        where: { role: Role.MENTOR, mentorBookings: { none: { status: { in: MEETING_STATUSES } } } },
      }),
      prisma.user.findMany({
        where: { role: Role.STUDENT, studentBookings: { none: { status: { in: MEETING_STATUSES } } } },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: INACTIVE_LIST_SIZE,
      }),
      prisma.user.findMany({
        where: { role: Role.MENTOR, mentorBookings: { none: { status: { in: MEETING_STATUSES } } } },
        select: {
          id: true,
          name: true,
          email: true,
          mentorDetail: { select: { industry: true, jobTitle: true } },
        },
        orderBy: { createdAt: "desc" },
        take: INACTIVE_LIST_SIZE,
      }),
    ]);

    const topStudentGroups = studentGroups.slice(0, TOP_LIST_SIZE);
    const topMentorGroups = mentorGroups.slice(0, TOP_LIST_SIZE);

    const [topStudentUsers, topMentorUsers] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: topStudentGroups.map((g) => g.studentId) } },
        select: { id: true, name: true, email: true },
      }),
      prisma.user.findMany({
        where: { id: { in: topMentorGroups.map((g) => g.mentorId) } },
        select: {
          id: true,
          name: true,
          email: true,
          mentorDetail: { select: { industry: true, jobTitle: true } },
        },
      }),
    ]);

    return {
      totalUsers,
      openReports,
      weeklyMeetings,
      cancelledMeetings,
      activeStudentsCount: studentGroups.length,
      activeMentorsCount: mentorGroups.length,
      topStudents: topStudentGroups.flatMap((g) => {
        const u = topStudentUsers.find((x) => x.id === g.studentId);
        return u ? [{ id: u.id, name: u.name, email: u.email, meetingCount: g._count._all }] : [];
      }),
      topMentors: topMentorGroups.flatMap((g) => {
        const u = topMentorUsers.find((x) => x.id === g.mentorId);
        return u
          ? [
              {
                id: u.id,
                name: u.name,
                email: u.email,
                specialty: u.mentorDetail?.industry ?? u.mentorDetail?.jobTitle ?? null,
                attendedCount: g._count._all,
              },
            ]
          : [];
      }),
      inactiveStudentCount,
      inactiveMentorCount,
      inactiveStudents: inactiveStudents.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        joinedDate: u.createdAt.toISOString(),
      })),
      inactiveMentors: inactiveMentors.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        specialty: u.mentorDetail?.industry ?? u.mentorDetail?.jobTitle ?? null,
      })),
    };
  }

  static async listUsers(filters: ListUsersFilters): Promise<{ users: AdminUserRow[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.q
        ? {
            OR: [
              { name: { contains: filters.q, mode: "insensitive" } },
              { email: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: USERS_PAGE_SIZE,
        include: {
          _count: {
            select: {
              reportsReceived: { where: { status: "OPEN" } },
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      total,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isSuspended: u.isSuspended,
        verificationStatus: u.verificationStatus,
        openReports: u._count.reportsReceived,
        joinedDate: u.createdAt.toISOString(),
      })),
    };
  }

  static async listReports(): Promise<AdminReportRow[]> {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        reportedUser: { select: { id: true, name: true, email: true, isSuspended: true, role: true } },
      },
    });

    // Report has no relation for the reporter, so resolve names separately
    const reporters = await prisma.user.findMany({
      where: { id: { in: [...new Set(reports.map((r) => r.reporterId))] } },
      select: { id: true, name: true, email: true },
    });
    const reporterById = new Map(reporters.map((u) => [u.id, u]));

    const rows = reports.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reportedUser: r.reportedUser,
      reporter: reporterById.get(r.reporterId) ?? null,
    }));

    // Open reports first, otherwise newest first (sort is stable)
    return rows.sort((a, b) => Number(b.status === "OPEN") - Number(a.status === "OPEN"));
  }
}
