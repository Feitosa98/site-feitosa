'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { sendMail } from '@/lib/mail';

export async function createCharge(data: any) {
    try {
        const charge = await prisma.charge.create({
            data: {
                description: data.description,
                value: parseFloat(data.value),
                dueDate: new Date(data.dueDate),
                status: 'PENDENTE',
                notes: data.notes,
                clientId: data.clientId,
                serviceId: data.serviceId || null,
            },
            include: { client: true }
        });

        // Send Email Notification
        if (charge.client.email) {
            const dueDateFormatted = new Date(charge.dueDate).toLocaleDateString('pt-BR');
            const valueFormatted = charge.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const link = `${process.env.NEXTAUTH_URL}/fatura/${charge.id}`; // Assuming public link

            await sendMail({
                to: charge.client.email,
                subject: `Nova Cobrança - Portal Feitosa`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>Nova Cobrança Gerada</h2>
                        <p>Olá <strong>${charge.client.name}</strong>,</p>
                        <p>Uma nova cobrança foi gerada para você.</p>
                        <hr />
                        <p><strong>Descrição:</strong> ${charge.description}</p>
                        <p><strong>Valor:</strong> ${valueFormatted}</p>
                        <p><strong>Vencimento:</strong> ${dueDateFormatted}</p>
                        <br />
                        <p>Acesse o link abaixo para visualizar a fatura e realizar o pagamento:</p>
                        <a href="${link}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Visualizar Fatura
                        </a>
                        <p style="margin-top: 20px; font-size: 12px; color: #666;">
                            Caso já tenha pago, por favor desconsidere este email.
                        </p>
                    </div>
                `
            });
        }

        revalidatePath('/admin/financeiro');
        return { success: true, id: charge.id };
    } catch (error: any) {
        console.error('Error creating charge:', error);
        return { success: false, error: error.message };
    }
}

export async function updateChargeDate(id: string, newDate: string) {
    try {
        // ... existing update logic ...
        const charge = await prisma.charge.update({
            where: { id },
            data: {
                // Set to Noon UTC to avoid timezone issues (e.g. 00:00 UTC might be previous day in -4)
                dueDate: new Date(newDate + 'T12:00:00Z'),
                status: 'PENDENTE' // Reset status to pending
            },
            include: { client: true }
        });

        // Invalidate Cached PDF (Logic unchanged)
        try {
            const fs = require('fs');
            const path = require('path');
            const pdfPath = path.join(process.cwd(), 'uploads', 'charges', `fatura-${id}.pdf`);
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
        } catch (e) {
            console.error('Failed to delete cached PDF:', e);
        }

        // Send Email Notification for Update
        if (charge.client.email) {
            const dueDateFormatted = new Date(charge.dueDate).toLocaleDateString('pt-BR');
            const link = `${process.env.NEXTAUTH_URL}/fatura/${charge.id}`;

            await sendMail({
                to: charge.client.email,
                subject: `Cobrança Atualizada - Portal Feitosa`,
                html: `
                     <div style="font-family: Arial, sans-serif; color: #333;">
                         <h2>Cobrança Atualizada</h2>
                         <p>Olá <strong>${charge.client.name}</strong>,</p>
                         <p>A data de vencimento da sua fatura foi atualizada.</p>
                         <hr />
                         <p><strong>Nova Data de Vencimento:</strong> ${dueDateFormatted}</p>
                         <br />
                         <p>Acesse o link abaixo para visualizar a fatura atualizada:</p>
                         <a href="${link}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                             Visualizar Fatura
                         </a>
                     </div>
                 `
            });
        }

        revalidatePath('/admin/financeiro');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Erro ao atualizar vencimento' };
    }
}

export async function cancelCharge(id: string) {
    try {
        await prisma.charge.update({
            where: { id },
            data: { status: 'CANCELADO' }
        });
        revalidatePath('/admin/financeiro');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Erro ao cancelar cobrança' };
    }
}

export async function markAsPaid(id: string) {
    try {
        const updatedCharge = await prisma.charge.update({
            where: { id },
            data: {
                status: 'PAGO',
                paymentDate: new Date(),
                paymentType: 'MANUAL_ADMIN'
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
                        <p>Confirmamos o pagamento manual da cobrança abaixo:</p>
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Descrição:</strong> ${updatedCharge.description}</p>
                            <p style="margin: 5px 0;"><strong>Valor Pago:</strong> ${amountFormatted}</p>
                            <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <p>Obrigado pela preferência!</p>
                    </div>
                `
            });
        }

        // Generate Receipt Logic could be here too or shared, but for simplicity we rely on the charge status update.
        // Ideally we should create the Receipt record here too.

        // Create Receipt Record
        const date = new Date();
        const datePrefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

        const lastReceipt = await prisma.receipt.findFirst({
            where: { numero: { startsWith: datePrefix } },
            orderBy: { numero: 'desc' }
        });

        let nextSequence = '0001';
        if (lastReceipt) {
            const currentSequence = lastReceipt.numero.slice(-4);
            nextSequence = String(parseInt(currentSequence) + 1).padStart(4, '0');
        }

        await prisma.receipt.create({
            data: {
                numero: `${datePrefix}${nextSequence}`,
                value: updatedCharge.value,
                description: updatedCharge.description,
                paymentDate: new Date(),
                paymentType: 'MANUAL_ADMIN',
                clientId: updatedCharge.clientId,
                chargeId: updatedCharge.id
            }
        });

        revalidatePath('/admin/financeiro');
        return { success: true };
    } catch (error: any) {
        console.error('Error marking as paid:', error);
        return { success: false, error: 'Erro ao marcar como pago' };
    }
}
