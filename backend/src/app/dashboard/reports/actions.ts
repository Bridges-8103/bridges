'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function resolveReport(reportId: string, action: 'DISMISS' | 'SUSPEND') {
  try {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) return { success: false, error: 'Report not found' };

    if (action === 'SUSPEND') {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isSuspended: true },
      });
    }

    await prisma.report.update({
      where: { id: reportId },
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