import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const services = await prisma.service.findMany({
            where: { active: true },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(services);
    } catch (error: any) {
        console.error('Error fetching services:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
