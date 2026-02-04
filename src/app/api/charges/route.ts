import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        console.log('[Charges API] Starting GET request...');
        const session = await auth();
        if (!session) {
            console.log('[Charges API] Unauthorized');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as any;
        const whereClause: any = {};

        if (user.role !== 'admin') {
            if (!user.clientId) {
                return NextResponse.json({ error: 'Client ID missing for user' }, { status: 403 });
            }
            whereClause.clientId = user.clientId;
        }

        console.log('[Charges API] Fetching charges...');
        const charges = await prisma.charge.findMany({
            where: whereClause,
            include: {
                client: true,
                service: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Update status for overdue charges
        const now = new Date();
        for (const charge of charges) {
            if (charge.status === 'PENDENTE' && new Date(charge.dueDate) < now) {
                await prisma.charge.update({
                    where: { id: charge.id },
                    data: { status: 'VENCIDO' }
                });
                charge.status = 'VENCIDO';
            }
        }

        console.log(`[Charges API] Returning ${charges.length} charges`);
        return NextResponse.json(charges);
    } catch (error: any) {
        console.error('[Charges API] Error fetching charges:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        const charge = await prisma.charge.create({
            data: {
                description: body.description,
                value: parseFloat(body.value),
                dueDate: new Date(body.dueDate),
                status: 'PENDENTE',
                clientId: body.clientId,
                serviceId: body.serviceId || null,
                notes: body.notes || null
            },
            include: {
                client: true,
                service: true
            }
        });

        return NextResponse.json(charge);
    } catch (error: any) {
        console.error('Error creating charge:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
