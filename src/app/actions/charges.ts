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
        const charge = await prisma.charge.update({
            where: { id },
            data: {
                // Set to Noon UTC to avoid timezone issues (e.g. 00:00 UTC might be previous day in -4)
                dueDate: new Date(newDate + 'T12:00:00Z'),
                status: 'PENDENTE' // Reset status to pending
            },
            include: { client: true }
        });

        // Invalidate Cached PDF
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
