
'use server';

import prisma from '@/lib/prisma';

export async function getNotes(clientId?: string) {
    try {
        const where = clientId ? { clientId } : {};
        return await prisma.note.findMany({
            where,
            orderBy: { emissionDate: 'desc' },
            take: 50 // Limit to recent 50
        });
    } catch (e) {
        console.error('Error fetching notes:', e);
        return [];
    }
}
