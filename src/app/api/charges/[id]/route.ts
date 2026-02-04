import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const charge = await prisma.charge.findUnique({
            where: { id },
            include: {
                client: true,
                service: true
            }
        });

        if (!charge) {
            return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
        }

        const user = session.user as any;
        if (user.role !== 'admin' && charge.clientId !== user.clientId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(charge);
    } catch (error: any) {
        console.error('Error fetching charge:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
