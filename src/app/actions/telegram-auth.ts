'use server';

import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';

export async function generateTelegramCode(userEmail: string) {
    if (!userEmail) return { error: 'Email required' };

    try {
        const code = randomBytes(3).toString('hex').toUpperCase(); // 6 chars

        await prisma.financeUser.update({
            where: { email: userEmail },
            data: { telegramConnectCode: code }
        });

        revalidatePath('/financeiro');
        return { success: true, code };
    } catch (error) {
        console.error('Error generating telegram code:', error);
        return { error: 'Failed to generate code' };
    }
}

export async function getTelegramStatus(userEmail: string) {
    if (!userEmail) return { connected: false };

    const user = await prisma.financeUser.findUnique({
        where: { email: userEmail },
        select: {
            telegramChatId: true,
            telegramUsername: true,
            telegramName: true
        }
    });

    return {
        connected: !!user?.telegramChatId,
        username: user?.telegramUsername,
        name: user?.telegramName
    };
}
