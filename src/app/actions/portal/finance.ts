'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getClientTransactions() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { clientId: true }
        });

        if (!user?.clientId) return [];

        const transactions = await prisma.clientTransaction.findMany({
            where: { clientId: user.clientId },
            orderBy: { date: 'desc' }
        });

        return transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

export async function getFinanceSummary() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { income: 0, expense: 0, balance: 0 };

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { clientId: true }
        });

        if (!user?.clientId) return { income: 0, expense: 0, balance: 0 };

        const transactions = await prisma.clientTransaction.findMany({
            where: { clientId: user.clientId }
        });

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
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { clientId: true }
        });

        if (!user?.clientId) return { success: false, error: 'No Client ID' };

        await prisma.clientTransaction.create({
            data: {
                description: data.description,
                value: parseFloat(data.value),
                type: data.type, // INCOME, EXPENSE
                category: data.category || 'OUTROS',
                date: new Date(data.date),
                status: data.status || 'PAID',
                clientId: user.clientId
            }
        });

        revalidatePath('/portal/financeiro');
        return { success: true };
    } catch (error) {
        console.error('Error creating transaction:', error);
        return { success: false, error: 'Failed' };
    }
}

export async function deleteTransaction(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { clientId: true }
        });

        if (!user?.clientId) return { success: false, error: 'No Client ID' };

        // Ensure transaction belongs to client
        const count = await prisma.clientTransaction.count({
            where: { id, clientId: user.clientId }
        });

        if (count === 0) return { success: false, error: 'Not Found' };

        await prisma.clientTransaction.delete({ where: { id } });

        revalidatePath('/portal/financeiro');
        return { success: true };
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return { success: false, error: 'Failed' };
    }
}
