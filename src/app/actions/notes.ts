
'use server';

import prisma from '@/lib/prisma';

export async function getNotes() {
    try {
        return await prisma.note.findMany({
            orderBy: { emissionDate: 'desc' },
            take: 50 // Limit to recent 50
        });
    } catch (e) {
        return [];
    }
}
