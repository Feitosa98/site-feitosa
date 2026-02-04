'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateSettings(data: any) {
    try {
        await prisma.settings.upsert({
            where: { id: 'settings' },
            create: {
                id: 'settings',
                ...data
            },
            update: data
        });

        revalidatePath('/admin/configuracoes'); // Revalidate wherever settings are used
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
