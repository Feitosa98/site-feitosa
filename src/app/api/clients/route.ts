import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clients = await prisma.client.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(clients);
    } catch (error: any) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
