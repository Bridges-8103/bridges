'use server';

import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';
import { ApiError } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function toggleUserSuspension(userId: number | string, currentStatus: boolean) {
  try {
    await requireAdmin();

    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(id)) {
      return { success: false, error: 'Invalid user ID' };
    }

    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return { success: false, error: 'User not found' };
    if (target.role === 'ADMIN') {
      return { success: false, error: 'Admin accounts cannot be suspended' };
    }

    await prisma.user.update({
      where: { id },
      data: { isSuspended: !currentStatus },
    });

    revalidatePath('/dashboard/users');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }
    console.error('Failed to update user status:', error);
    return { success: false, error: 'Failed to update user status' };
  }
}
