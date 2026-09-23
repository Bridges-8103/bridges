'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleUserSuspension(userId: number | string, currentStatus: boolean) {
  try {
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    if (isNaN(id)) {
      return { success: false, error: 'Invalid user ID' };
    }

    await prisma.user.update({
      where: { id },
      data: { isSuspended: !currentStatus },
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Failed to update user status:', error);
    return { success: false, error: 'Failed to update user status' };
  }
}
