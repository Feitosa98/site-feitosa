'use server';

import { prisma } from '@/lib/prisma';
import { getFinanceUser } from '@/lib/finance-auth';

export async function getMonthlyData(year: number) {
    try {
        const user = await getFinanceUser();
        if (!user) return [];

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const transactions = await prisma.financeTransaction.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { date: 'asc' }
        });

        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(year, i).toLocaleString('pt-BR', { month: 'short' }),
            income: 0,
            expense: 0,
            balance: 0
        }));

        transactions.forEach(t => {
            const month = t.date.getMonth();
            if (t.type === 'INCOME') {
                monthlyData[month].income += t.value;
            } else {
                monthlyData[month].expense += t.value;
            }
        });

        monthlyData.forEach(m => {
            m.balance = m.income - m.expense;
        });

        return monthlyData;
    } catch (error) {
        console.error('Error in getMonthlyData:', error);
        return [];
    }
}

export async function getExportData(year: number) {
    try {
        const user = await getFinanceUser();
        if (!user) return [];

        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);

        const transactions = await prisma.financeTransaction.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                categoryRel: true
            },
            orderBy: { date: 'desc' }
        });

        // Explicit mapping to avoid type inference issues
        return transactions.map((t: any) => ({
            Data: t.date.toLocaleDateString('pt-BR'),
            Descricao: t.description,
            Categoria: t.categoryRel?.name || t.category,
            Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
            Valor: t.value,
            Status: t.status
        }));
    } catch (error) {
        console.error('Error in getExportData:', error);
        return [];
    }
}
