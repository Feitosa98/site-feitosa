import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Update charge as paid
        const charge = await prisma.charge.update({
            where: { id },
            data: {
                status: 'PAGO',
                paymentDate: new Date(),
                paymentType: body.paymentType || 'PIX'
            },
            include: {
                client: true
            }
        });

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

        // Create receipt
        const receipt = await prisma.receipt.create({
            data: {
                numero: nextReceiptNumber,
                value: charge.value,
                description: charge.description,
                paymentDate: new Date(),
                paymentType: body.paymentType || 'PIX',
                clientId: charge.clientId,
                chargeId: charge.id
            }
        });

        return NextResponse.json({
            success: true,
            charge,
            receipt,
            message: 'Pagamento confirmado e recibo gerado!'
        });
    } catch (error: any) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
