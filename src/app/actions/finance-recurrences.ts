'use server';

import { prisma } from '@/lib/prisma';
import { getFinanceUser } from '@/lib/finance-auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Schema Validation
const RecurrenceSchema = z.object({
    description: z.string().min(1, "Descrição é obrigatória"),
    value: z.coerce.number().min(0.01, "Valor deve ser maior que 0"),
    type: z.enum(['INCOME', 'EXPENSE']),
    frequency: z.enum(['MONTHLY', 'WEEKLY']),
    categoryId: z.string().optional(),
    nextRun: z.string().or(z.date()).transform(val => new Date(val)),
});

export async function getRecurrences() {
    try {
        const user = await getFinanceUser();
        if (!user) return [];

        const data = await prisma.financeRecurrence.findMany({
            where: { userId: user.id },
            orderBy: { nextRun: 'asc' },
            include: { category: true }
        });
        return data;
    } catch (error: any) {
        console.error('Error in getRecurrences:', error.message);
        return [];
    }
}

export async function createRecurrence(data: any) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const validated = RecurrenceSchema.parse(data);

        await prisma.financeRecurrence.create({
            data: {
                ...validated,
                userId: user.id,
                active: true
            }
        });

        revalidatePath('/financeiro/recorrencias');
        return { success: true };
    } catch (error) {
        console.error('Create Recurrence Error:', error);
        return { success: false, error: 'Falha ao criar recorrência' };
    }
}

export async function updateRecurrence(id: string, data: any) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify ownership
        const existing = await prisma.financeRecurrence.findFirst({
            where: { id, userId: user.id }
        });
        if (!existing) return { success: false, error: 'Recorrência não encontrada' };

        const validated = RecurrenceSchema.parse(data);

        await prisma.financeRecurrence.update({
            where: { id },
            data: validated
        });

        revalidatePath('/financeiro/recorrencias');
        return { success: true };
    } catch (error) {
        console.error('Update Recurrence Error:', error);
        return { success: false, error: 'Falha ao atualizar' };
    }
}

export async function deleteRecurrence(id: string) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        await prisma.financeRecurrence.deleteMany({
            where: { id, userId: user.id }
        });

        revalidatePath('/financeiro/recorrencias');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Falha ao excluir' };
    }
}

export async function toggleRecurrence(id: string, active: boolean) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        await prisma.financeRecurrence.updateMany({
            where: { id, userId: user.id },
            data: { active }
        });

        revalidatePath('/financeiro/recorrencias');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Falha ao alterar status' };
    }
}
