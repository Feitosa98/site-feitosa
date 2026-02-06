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

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyData = monthNames.map(name => ({
            name,
            income: 0,
            expense: 0,
            balance: 0
        }));

        transactions.forEach(t => {
            const date = new Date(t.date);
            const month = date.getMonth();
            if (month >= 0 && month < 12) {
                if (t.type === 'INCOME') {
                    monthlyData[month].income += t.value;
                } else {
                    monthlyData[month].expense += t.value;
                }
            }
        });

        monthlyData.forEach(m => {
            m.balance = m.income - m.expense;
        });

        return monthlyData;
    } catch (error: any) {
        console.error('Error in getMonthlyData:', error.message);
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

        return transactions.map((t: any) => {
            const date = new Date(t.date);
            return {
                Data: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
                Descricao: t.description,
                Categoria: t.categoryRel?.name || t.category,
                Tipo: t.type === 'INCOME' ? 'Receita' : 'Despesa',
                Valor: t.value,
                Status: t.status
            };
        });
    } catch (error: any) {
        console.error('Error in getExportData:', error.message);
        return [];
    }
}
