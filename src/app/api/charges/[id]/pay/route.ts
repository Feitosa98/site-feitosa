import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { sendMail } from '@/lib/mail';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const paymentType = body.paymentType || 'PIX'; // Define paymentType from body

        // Update Charge
        const updatedCharge = await prisma.charge.update({
            where: { id },
            data: {
                status: 'PAGO',
                paymentDate: new Date(),
                paymentType: paymentType // Use the defined paymentType
            },
            include: { client: true }
        });

        // Send Receipt Email
        if (updatedCharge.client.email) {
            const amountFormatted = updatedCharge.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            await sendMail({
                to: updatedCharge.client.email,
                subject: `Recibo de Pagamento - Portal Feitosa`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #166534;">Pagamento Confirmado!</h2>
                        <p>Olá <strong>${updatedCharge.client.name}</strong>,</p>
                        <p>Recebemos o pagamento referente à cobrança abaixo:</p>
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Descrição:</strong> ${updatedCharge.description}</p>
                            <p style="margin: 5px 0;"><strong>Valor Pago:</strong> ${amountFormatted}</p>
                            <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <p>Obrigado pela preferência!</p>
                        <br />
                        <p style="font-size: 12px; color: #666;">
                            Este é um recibo eletrônico automático.
                        </p>
                    </div>
                `
            });
        }

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
                value: updatedCharge.value,
                description: updatedCharge.description,
                paymentDate: new Date(),
                paymentType: body.paymentType || 'PIX',
                clientId: updatedCharge.clientId,
                chargeId: updatedCharge.id
            }
        });

        return NextResponse.json({
            success: true,
            charge: updatedCharge,
            receipt,
            message: 'Pagamento confirmado e recibo gerado!'
        });
    } catch (error: any) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
