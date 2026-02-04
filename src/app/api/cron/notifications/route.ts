import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMail } from '@/lib/mail';

export const dynamic = 'force-dynamic'; // Prevent static caching

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);

        const oneDayAgo = new Date(today);
        oneDayAgo.setDate(today.getDate() - 1);

        // 1. Reminder (3 days before due date)
        const chargesDueSoon = await prisma.charge.findMany({
            where: {
                status: 'PENDENTE',
                dueDate: {
                    gte: threeDaysFromNow,
                    lt: new Date(threeDaysFromNow.getTime() + 86400000) // Within the day
                },
                client: { email: { not: null } }
            },
            include: { client: true }
        });

        for (const charge of chargesDueSoon) {
            if (!charge.client.email) continue;

            await sendMail({
                to: charge.client.email,
                subject: `Lembrete de Vencimento - Portal Feitosa`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2>Lembrete de Vencimento</h2>
                        <p>Olá <strong>${charge.client.name}</strong>,</p>
                        <p>Lembramos que sua fatura vence em 3 dias.</p>
                        <p><strong>Vencimento:</strong> ${new Date(charge.dueDate).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Valor:</strong> ${charge.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <br />
                        <a href="${process.env.NEXTAUTH_URL}/fatura/${charge.id}">Visualizar Fatura</a>
                    </div>
                `
            });
        }

        // 2. Due Today Notification
        const chargesDueToday = await prisma.charge.findMany({
            where: {
                status: 'PENDENTE',
                dueDate: {
                    gte: today,
                    lt: new Date(today.getTime() + 86400000)
                },
                client: { email: { not: null } }
            },
            include: { client: true }
        });

        for (const charge of chargesDueToday) {
            if (!charge.client.email) continue;

            await sendMail({
                to: charge.client.email,
                subject: `Fatura Vence Hoje - Portal Feitosa`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #eab308;">Sua Fatura Vence Hoje!</h2>
                        <p>Olá <strong>${charge.client.name}</strong>,</p>
                        <p>Hoje é o vencimento da sua fatura.</p>
                         <p><strong>Valor:</strong> ${charge.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <br />
                        <a href="${process.env.NEXTAUTH_URL}/fatura/${charge.id}">Pagar Agora</a>
                    </div>
                `
            });
        }

        // 3. Overdue Notification (Mark as VENCIDO and notify)
        const overdueCharges = await prisma.charge.findMany({
            where: {
                status: 'PENDENTE',
                dueDate: { lt: today },
                client: { email: { not: null } }
            },
            include: { client: true }
        });

        for (const charge of overdueCharges) {
            // Update status to VENCIDO
            await prisma.charge.update({
                where: { id: charge.id },
                data: { status: 'VENCIDO' }
            });

            // Invalidate PDF cache
            try {
                const fs = require('fs');
                const path = require('path');
                const pdfPath = path.join(process.cwd(), 'uploads', 'charges', `fatura-${charge.id}.pdf`);
                if (fs.existsSync(pdfPath)) {
                    fs.unlinkSync(pdfPath);
                    console.log(`Deleted cached PDF for charge ${charge.id}`);
                }
            } catch (e) {
                console.error('Failed to delete cached PDF:', e);
            }

            if (!charge.client.email) continue;

            // Simple Interest Calculation Logic (Mocked for now as per requirement "multa e juros")
            // In a real scenario, we might want to update the value in DB or just show calculated value
            // For now, let's just warn about interest

            await sendMail({
                to: charge.client.email,
                subject: `Fatura Vencida - Portal Feitosa`,
                html: `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #dc2626;">Fatura Vencida</h2>
                        <p>Olá <strong>${charge.client.name}</strong>,</p>
                        <p>Sua fatura venceu em ${new Date(charge.dueDate).toLocaleDateString('pt-BR')}.</p>
                        <p>Por favor, realize o pagamento o quanto antes para evitar bloqueio dos serviços.</p>
                        <p><em>* Multas e juros podem ser aplicados no momento do pagamento.</em></p>
                        <br />
                        <a href="${process.env.NEXTAUTH_URL}/fatura/${charge.id}" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Atualizar Boleto e Pagar
                        </a>
                    </div>
                `
            });
        }

        return NextResponse.json({
            success: true,
            processed: {
                reminders: chargesDueSoon.length,
                dueToday: chargesDueToday.length,
                overdue: overdueCharges.length
            }
        });

    } catch (error: any) {
        console.error('Notification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
