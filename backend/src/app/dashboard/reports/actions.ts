'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function resolveReport(reportId: number | string, action: 'DISMISS' | 'SUSPEND') {
  try {
    const id = typeof reportId === 'string' ? parseInt(reportId, 10) : reportId;
    if (isNaN(id)) {
      return { success: false, error: 'Invalid report ID' };
    }

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) return { success: false, error: 'Report not found' };

    if (action === 'SUSPEND') {
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
    return { success: true };
  } catch (error) {
    console.error('Failed to resolve report:', error);
    return { success: false, error: 'Failed to update report' };
  }
}