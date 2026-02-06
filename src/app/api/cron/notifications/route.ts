import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMail } from '@/lib/mail';
import { sendMessage } from '@/lib/telegram';

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
                    lt: new Date(threeDaysFromNow.getTime() + 86400000)
                },
                client: { email: { not: null } }
            },
            include: { client: { include: { users: true } } }
        });

        for (const charge of chargesDueSoon) {
            // Email (existing)
            if (charge.client.email) {
                // ... (keep existing email logic)
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

            // Telegram
            // Check if any user linked to this client has Telegram (assuming FinanceUser might be linked or we use User model - wait, FinanceUser is separate. This Cron is for CLIENT invoices from the main system.)
            // The requirement was "Finance System", but the cron shows "Portal Feitosa" (Client Billing).
            // Users in "Financeiro" (Personal Finance) might not be the same as "Clients" (Business).
            // BUT, the prompt asked: "Chatbot no telegram para integrar com o sistema financeiro? ... enviam despesas... E envia lembretes de contas a vencer?"
            // "Contas a vencer" usually implies the bills created in the personal finance system OR the bills the client owes to Feitosa.
            // Given "My Finances" context, it's likely Personal Finance *Expenses*.
            // BUT, the file `src/app/api/cron/notifications/route.ts` handles `prisma.charge` which are Business Charges (Invoices sent to clients).

            // Let's implement BOTH if possible, or clarification.
            // Assuming "Finance System" means the personal finance dashboard we just built:
            // We need a NEW check for `FinanceTransaction` of type EXPENSE that are due? 
            // The `FinanceTransaction` model has `status` and `date`, but not `dueDate` explicitly (it has `date` which acts as due date for expenses?).
            // Let's assume `date` is the due date for future expenses.
        }

        // --- NEW BLOCK FOR PERSONAL FINANCE EXPENSES ---
        const financeExpensesDueSoon = await prisma.financeTransaction.findMany({
            where: {
                type: 'EXPENSE',
                status: { not: 'PAID' },
                date: {
                    gte: threeDaysFromNow,
                    lt: new Date(threeDaysFromNow.getTime() + 86400000)
                },
                user: { telegramChatId: { not: null } }
            },
            include: { user: true }
        });

        for (const expense of financeExpensesDueSoon) {
            if (expense.user.telegramChatId) {
                await sendMessage(
                    expense.user.telegramChatId,
                    `⚠️ <b>Lembrete de Despesa</b>\n\nA despesa <b>${expense.description}</b> de R$ ${expense.value.toFixed(2)} vence em 3 dias (${new Date(expense.date).toLocaleDateString('pt-BR')}).`
                );
            }
        }

        // Check for today
        const financeExpensesDueToday = await prisma.financeTransaction.findMany({
            where: {
                type: 'EXPENSE',
                status: { not: 'PAID' },
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 86400000)
                },
                user: { telegramChatId: { not: null } }
            },
            include: { user: true }
        });

        for (const expense of financeExpensesDueToday) {
            if (expense.user.telegramChatId) {
                await sendMessage(
                    expense.user.telegramChatId,
                    `🚨 <b>VENCE HOJE!</b>\n\nA despesa <b>${expense.description}</b> de R$ ${expense.value.toFixed(2)} vence hoje!`
                );
            }
        }

        return NextResponse.json({
            success: true,
            processed: {
                reminders: chargesDueSoon.length,
                personalReminders: financeExpensesDueSoon.length + financeExpensesDueToday.length
            }
        });

    } catch (error: any) {
        console.error('Notification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
