'use server';

import { getFinanceUser } from '@/lib/finance-auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getClientTransactions(month?: number, year?: number) {
    try {
        const user = await getFinanceUser();
        if (!user) return [];

        const where: any = { userId: user.id };

        if (month !== undefined && year !== undefined) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            where.date = { gte: startDate, lte: endDate };
        }

        const transactions = await prisma.financeTransaction.findMany({
            where,
            orderBy: { date: 'desc' }
        });

        return transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

export async function getFinanceSummary(month?: number, year?: number) {
    try {
        const user = await getFinanceUser();
        if (!user) return { income: 0, expense: 0, balance: 0 };

        const where: any = { userId: user.id };

        if (month !== undefined && year !== undefined) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            where.date = { gte: startDate, lte: endDate };
        }

        const transactions = await prisma.financeTransaction.findMany({ where });

        const income = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((acc, t) => acc + t.value, 0);

        const expense = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, t) => acc + t.value, 0);

        return {
            income,
            expense,
            balance: income - expense
        };

    } catch (error) {
        console.error('Error fetching summary:', error);
        return { income: 0, expense: 0, balance: 0 };
    }
}

export async function createTransaction(data: any) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        await prisma.financeTransaction.create({
            data: {
                description: data.description,
                value: parseFloat(data.value),
                type: data.type, // INCOME, EXPENSE
                category: data.category || 'OUTROS',
                date: new Date(data.date),
                status: data.status || 'PAID',
                userId: user.id
            }
        });

        revalidatePath('/financeiro');
        return { success: true };
    } catch (error) {
        console.error('Error creating transaction:', error);
        return { success: false, error: 'Failed' };
    }
}

export async function updateTransaction(id: string, data: any) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Verify ownership
        const count = await prisma.financeTransaction.count({
            where: { id, userId: user.id }
        });
        if (count === 0) return { success: false, error: 'Not Found' };

        await prisma.financeTransaction.update({
            where: { id },
            data: {
                description: data.description,
                value: parseFloat(data.value),
                type: data.type,
                category: data.category,
                date: new Date(data.date),
            }
        });

        revalidatePath('/financeiro');
        return { success: true };
    } catch (error) {
        console.error('Error updating transaction:', error);
        return { success: false, error: 'Failed' };
    }
}

export async function deleteTransaction(id: string) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Ensure transaction belongs to user
        const count = await prisma.financeTransaction.count({
            where: { id, userId: user.id }
        });

        if (count === 0) return { success: false, error: 'Not Found' };

        await prisma.financeTransaction.delete({ where: { id } });

        revalidatePath('/financeiro');
        return { success: true };
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return { success: false, error: 'Failed' };
    }
}
