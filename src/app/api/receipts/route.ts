import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        console.log('[Receipts API] Starting GET request...');

        const session = await auth();
        if (!session) {
            console.log('[Receipts API] No session found');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Receipts API] Fetching receipts from database...');
        const receipts = await prisma.receipt.findMany({
            include: {
                client: true,
                charge: true
            },
            orderBy: {
                paymentDate: 'desc'
            }
        });

        console.log(`[Receipts API] Found ${receipts.length} receipts`);
        return NextResponse.json(receipts);
    } catch (error: any) {
        console.error('[Receipts API] Error fetching receipts:', error);
        console.error('[Receipts API] Error stack:', error.stack);
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

        // Generate Receipt Number: YYYYMMDD + Sequence (4 digits)
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const datePrefix = `${year}${month}${day}`;

        // Find last receipt created today to determine sequence
        const lastReceipt = await prisma.receipt.findFirst({
            where: {
                numero: {
                    startsWith: datePrefix
                }
            },
            orderBy: {
                numero: 'desc'
            }
        });

        let nextSequence = '0001';
        if (lastReceipt) {
            const currentSequence = lastReceipt.numero.slice(-4);
            const nextSeqNum = parseInt(currentSequence) + 1;
            nextSequence = String(nextSeqNum).padStart(4, '0');
        }

        const nextReceiptNumber = `${datePrefix}${nextSequence}`; // Example: 202602020001

        console.log(`[Receipts API] Generating receipt #${nextReceiptNumber}`);

        // Create standalone receipt
        const receipt = await prisma.receipt.create({
            data: {
                numero: nextReceiptNumber,
                value: parseFloat(body.value),
                description: body.description,
                paymentDate: new Date(body.paymentDate),
                paymentType: body.paymentType,
                clientId: body.clientId,
                chargeId: null // Standalone receipt (not linked to charge)
            },
            include: {
                client: true
            }
        });

        return NextResponse.json(receipt);
    } catch (error: any) {
        console.error('Error creating receipt:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
