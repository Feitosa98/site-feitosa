'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

export async function updateSettings(data: any) {
    try {
        let certPath = data.certificatePath;

        // Handle Certificate Upload
        if (data.certificateFile) {
            const certsDir = path.join(process.cwd(), 'certs');
            if (!fs.existsSync(certsDir)) {
                fs.mkdirSync(certsDir, { recursive: true });
            }

            const fileName = `certificate-${Date.now()}.pfx`;
            const filePath = path.join(certsDir, fileName);
            const buffer = Buffer.from(data.certificateFile, 'base64');

            fs.writeFileSync(filePath, buffer);
            certPath = filePath;
        }

        const payload = {
            environment: data.environment,
            emailEnabled: Boolean(data.emailEnabled),
            emailAddress: data.emailAddress || null,
            whatsappEnabled: Boolean(data.whatsappEnabled),
            whatsappNumber: data.whatsappNumber || null,
            certificatePath: certPath,
            certificatePassword: data.certificatePassword || null,
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
