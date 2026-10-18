'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { ApiError } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function resolveReport(reportId: number | string, action: 'DISMISS' | 'SUSPEND') {
  try {
    await requireAdmin();

    const id = typeof reportId === 'string' ? parseInt(reportId, 10) : reportId;
    if (isNaN(id)) {
      return { success: false, error: 'Invalid report ID' };
    }

    const report = await prisma.report.findUnique({
      where: { id },
      include: { reportedUser: { select: { role: true } } },
    });

    if (!report) return { success: false, error: 'Report not found' };
    if (report.status !== 'OPEN') return { success: false, error: 'Report is already resolved' };

    if (action === 'SUSPEND') {
      if (report.reportedUser.role === 'ADMIN') {
        return { success: false, error: 'Admin accounts cannot be suspended' };
      }
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isSuspended: true },
      });
    }

    await prisma.report.update({
      where: { id },
      data: { status: action === 'SUSPEND' ? 'RESOLVED_SUSPENDED' : 'DISMISSED' },
    });

    revalidatePath('/dashboard/reports');
    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    console.error('Failed to resolve report:', error);
    return { success: false, error: 'Failed to update report' };
  }
}
