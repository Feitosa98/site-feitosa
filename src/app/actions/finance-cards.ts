'use server'

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createCardSchema = z.object({
    userId: z.string(),
    name: z.string().min(2, "Nome muito curto"),
    dueDay: z.number().min(1).max(31),
    closingDay: z.number().min(1).max(31),
    color: z.string().optional().default("#820ad1"), // Default Nubank
    limit: z.number().optional().default(1000)
});

export async function getCards(userId: string) {
    if (!userId) return [];

    try {
        const cards = await prisma.financeCreditCard.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
            include: {
                // We could include transactions here to calculate invoice
                transactions: {
                    where: {
                        status: { not: 'PAID' },
                        // Logic for current invoice is tricky without date, 
                        // but let's fetch pending ones for now
                    },
                    select: { value: true }
                }
            }
        });

        // Calculate simplified "current invoice" estimate (sum of unpaid)
        return cards.map(card => ({
            ...card,
            currentInvoice: card.transactions.reduce((sum, t) => sum + t.value, 0)
        }));
    } catch (error) {
        console.error("Error fetching cards:", error);
        return [];
    }
}

export async function createCard(prevState: any, formData: FormData) {
    try {
        const rawData = {
            userId: formData.get('userId'),
            name: formData.get('name'),
            dueDay: parseInt(formData.get('dueDay') as string),
            closingDay: parseInt(formData.get('closingDay') as string),
            color: formData.get('color'),
            limit: parseFloat(formData.get('limit') as string || '0'),
        };

        const data = createCardSchema.parse(rawData);

        await prisma.financeCreditCard.create({
            data: {
                ...data,
                icon: 'credit-card'
            }
        });

        revalidatePath('/financeiro/cartoes');
        return { success: true, message: 'Cartão criado com sucesso!' };
    } catch (e: any) {
        return { success: false, message: e.errors ? e.errors[0].message : e.message };
    }
}

export async function deleteCard(cardId: string) {
    try {
        await prisma.financeCreditCard.delete({
            where: { id: cardId }
        });
        revalidatePath('/financeiro/cartoes');
        return { success: true };
    } catch (e) {
        return { success: false, message: 'Erro ao excluir cartão.' };
    }
}
