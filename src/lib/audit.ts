import prisma from '@/lib/prisma';
import { auth } from '@/auth';

export async function logAction(action: string, details?: string) {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        await prisma.auditLog.create({
            data: {
                action,
                details,
                userId: userId || null
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
}
