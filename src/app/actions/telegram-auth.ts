'use server';

import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { revalidatePath } from 'next/cache';
import { getFinanceUser } from '@/lib/finance-auth';

export async function generateTelegramCode() {
    try {
        const user = await getFinanceUser();
        if (!user) return { error: 'Unauthorized' };

        // Fetch full user record to get email if needed, but we can just use ID
        const code = randomBytes(3).toString('hex').toUpperCase(); // 6 chars

        await prisma.financeUser.update({
            where: { id: user.id },
            data: { telegramConnectCode: code }
        });

        revalidatePath('/financeiro');
        return { success: true, code };
    } catch (error) {
        console.error('Error generating telegram code:', error);
        return { error: 'Failed' };
    }
}

export async function getTelegramStatus() {
    try {
        const user = await getFinanceUser();
        if (!user) return { connected: false };

        const dbUser = await prisma.financeUser.findUnique({
            where: { id: user.id },
            select: {
                telegramChatId: true,
                telegramUsername: true,
                telegramName: true
            }
        });

        return {
            connected: !!dbUser?.telegramChatId,
            username: dbUser?.telegramUsername,
            name: dbUser?.telegramName
        };
    } catch (error) {
        console.error('Error fetching telegram status:', error);
        return { connected: false };
    }
}
