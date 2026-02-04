import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await auth();
        const user = session?.user as any;

        if (!user || !user.clientId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const osList = await prisma.serviceOrder.findMany({
            where: {
                clientId: user.clientId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                charge: {
                    select: {
                        id: true,
                        status: true,
                        value: true
                    }
                }
            }
        });

        return NextResponse.json(osList);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
