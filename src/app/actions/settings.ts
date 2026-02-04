'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSettings(data: any) {
    try {
        const payload = {
            environment: data.environment,
            emailEnabled: Boolean(data.emailEnabled),
            emailAddress: data.emailAddress || null,
            whatsappEnabled: Boolean(data.whatsappEnabled),
            whatsappNumber: data.whatsappNumber || null,
            smtpHost: data.smtpHost || null,
            smtpPort: data.smtpPort || null,
            smtpUser: data.smtpUser || null,
            smtpPassword: data.smtpPassword || null,
            smtpFrom: data.smtpFrom || null,
        };

        await prisma.settings.upsert({
            where: { id: 'settings' },
            create: {
                id: 'settings',
                ...payload
            },
            update: payload
        });

        revalidatePath('/admin/configuracoes');
        return { success: true };
    } catch (error) {
        console.error('Failed to update settings:', error);
        return { success: false, error: 'Failed to update settings' };
    }
}

export async function getSettings() {
    try {
        const settings = await prisma.settings.findUnique({
            where: { id: 'settings' }
        });
        return settings || {};
    } catch (error) {
        return {};
    }
}
