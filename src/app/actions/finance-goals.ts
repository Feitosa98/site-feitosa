'use server';

import { prisma } from '@/lib/prisma';
import { getFinanceUser } from '@/lib/finance-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const GoalSchema = z.object({
    categoryId: z.string().min(1, "Categoria obrigatória"),
    amount: z.coerce.number().min(0.01, "Valor deve ser maior que 0"),
    period: z.enum(['MONTHLY']).default('MONTHLY')
});

export async function getGoals() {
    try {
        const user = await getFinanceUser();
        if (!user) return [];

        return await prisma.financeGoal.findMany({
            where: { userId: user.id },
            include: { category: true }
        });
    } catch (error) {
        console.error('Error fetching goals:', error);
        return [];
    }
}

export async function createGoal(data: any) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const validated = GoalSchema.parse(data);

        // Check if goal already exists for this category
        const existing = await prisma.financeGoal.findFirst({
            where: {
                userId: user.id,
                categoryId: validated.categoryId
            }
        });

        if (existing) {
            return { success: false, error: 'Já existe uma meta para esta categoria' };
        }

        await prisma.financeGoal.create({
            data: {
                ...validated,
                userId: user.id
            }
        });

        revalidatePath('/financeiro/metas');
        return { success: true };
    } catch (error) {
        console.error('Create Goal Error:', error);
        return { success: false, error: 'Falha ao criar meta' };
    }
}

export async function updateGoal(id: string, data: any) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const validated = GoalSchema.parse(data);

        await prisma.financeGoal.update({
            where: { id },
            data: {
                amount: validated.amount
            }
        });

        revalidatePath('/financeiro/metas');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Falha ao atualizar meta' };
    }
}

export async function deleteGoal(id: string) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        await prisma.financeGoal.delete({
            where: { id }
        });

        revalidatePath('/financeiro/metas');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Falha ao excluir meta' };
    }
}
