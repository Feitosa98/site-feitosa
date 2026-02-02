'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getExpenses() {
    return await prisma.expense.findMany({
        orderBy: { date: 'desc' }
    });
}

export async function getExpense(id: string) {
    return await prisma.expense.findUnique({
        where: { id }
    });
}

export async function createExpense(formData: FormData) {
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const value = parseFloat(formData.get('value') as string);
    const date = new Date(formData.get('date') as string);
    const notes = formData.get('notes') as string;

    try {
        await prisma.expense.create({
            data: {
                description,
                category,
                value,
                date,
                notes
            }
        });

        revalidatePath('/admin/financeiro/despesas');
        revalidatePath('/admin/financeiro');
        return { success: true, message: 'Despesa cadastrada com sucesso!' };
    } catch (error: any) {
        console.error('Error creating expense:', error);
        return { success: false, message: `Erro ao cadastrar despesa: ${error.message}` };
    }
}

export async function updateExpense(id: string, formData: FormData) {
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const value = parseFloat(formData.get('value') as string);
    const date = new Date(formData.get('date') as string);
    const notes = formData.get('notes') as string;

    try {
        await prisma.expense.update({
            where: { id },
            data: {
                description,
                category,
                value,
                date,
                notes
            }
        });

        revalidatePath('/admin/financeiro/despesas');
        revalidatePath('/admin/financeiro');
        return { success: true, message: 'Despesa atualizada com sucesso!' };
    } catch (error: any) {
        console.error('Error updating expense:', error);
        return { success: false, message: `Erro ao atualizar despesa: ${error.message}` };
    }
}

export async function deleteExpense(id: string) {
    try {
        await prisma.expense.delete({
            where: { id }
        });

        revalidatePath('/admin/financeiro/despesas');
        revalidatePath('/admin/financeiro');
        return { success: true, message: 'Despesa removida com sucesso!' };
    } catch (error: any) {
        console.error('Error deleting expense:', error);
        return { success: false, message: `Erro ao remover despesa: ${error.message}` };
    }
}

export async function getTotalExpenses() {
    const expenses = await prisma.expense.findMany();
    return expenses.reduce((sum, expense) => sum + expense.value, 0);
}
