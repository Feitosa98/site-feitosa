import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage } from '@/lib/telegram';

export async function GET() {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Reset times for comparison
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);

        // 1. Find unpaid bills due today/tomorrow
        const dueTransactions = await prisma.financeTransaction.findMany({
            where: {
                status: { not: 'PAID' },
                dueDate: {
                    gte: today,
                    lte: new Date(tomorrow.getTime() + 86400000) // End of tomorrow
                },
                user: { telegramChatId: { not: null } }
            },
            include: { user: true }
        });

        // 2. Find credit cards closing soon (e.g. tomorrow)
        // Closing day logic is simpler: find cards where closingDay == tomorrow.getDate()
        const closingCards = await prisma.financeCreditCard.findMany({
            where: {
                closingDay: tomorrow.getDate(),
                user: { telegramChatId: { not: null } }
            },
            include: { user: true }
        });

        const notifications = [];

        // Process Bills
        for (const tx of dueTransactions) {
            const isToday = tx.dueDate && tx.dueDate.getDate() === today.getDate();
            const timeText = isToday ? 'HOJE' : 'AMANHÃ';
            const msg = `⚠️ Lembrete: "${tx.description}" vence ${timeText}! Valor: R$ ${tx.value.toFixed(2)}`;
            if (tx.user.telegramChatId) {
                await sendMessage(tx.user.telegramChatId, msg);
                notifications.push({ type: 'bill', user: tx.user.email, desc: tx.description });
            }
        }

        // Process Cards
        for (const card of closingCards) {
            const msg = `💳 Fatura do cartão ${card.name} fecha AMANHÃ! Verifique seus gastos.`;
            if (card.user.telegramChatId) {
                await sendMessage(card.user.telegramChatId, msg);
                notifications.push({ type: 'card', user: card.user.email, card: card.name });
            }
        }

        return NextResponse.json({ ok: true, sent: notifications.length, details: notifications });
    } catch (error: any) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
