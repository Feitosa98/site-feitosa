import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const osList = await prisma.serviceOrder.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: {
                    select: { id: true, name: true }
                }
            }
        });

        return NextResponse.json(osList);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
