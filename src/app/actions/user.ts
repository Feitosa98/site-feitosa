'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function changePassword(userId: string, newPassword: string) {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
                mustChangePassword: false
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, error: 'Failed' };
    }
}
