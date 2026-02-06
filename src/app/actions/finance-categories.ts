'use server';

import prisma from '@/lib/prisma';
import { getFinanceUser } from '@/lib/finance-auth';
import { revalidatePath } from 'next/cache';

export async function getCategories() {
    try {
        const user = await getFinanceUser();
        if (!user) return [];

        return await prisma.financeCategory.findMany({
            where: { userId: user.id },
            orderBy: { name: 'asc' }
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
}

export async function createCategory(data: any) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        await prisma.financeCategory.create({
            data: {
                name: data.name,
                color: data.color || '#3498DB',
                icon: data.icon || '📝',
                type: data.type || 'EXPENSE',
                userId: user.id
            }
        });

        revalidatePath('/financeiro');
        return { success: true };
    } catch (error) {
        console.error('Error creating category:', error);
        return { success: false, error: 'Failed' };
    }
}

export async function updateCategory(id: string, data: any) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        // Check ownership
        const exists = await prisma.financeCategory.count({
            where: { id, userId: user.id }
        });

        if (!exists) return { success: false, error: 'Not found' };

        await prisma.financeCategory.update({
            where: { id },
            data: {
                name: data.name,
                color: data.color,
                icon: data.icon,
                type: data.type
            }
        });

        revalidatePath('/financeiro');
        return { success: true };
    } catch (error) {
        console.error('Error updating category:', error);
        return { success: false, error: 'Failed' };
    }
}

export async function deleteCategory(id: string) {
    try {
        const user = await getFinanceUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const exists = await prisma.financeCategory.count({
            where: { id, userId: user.id }
        });

        if (!exists) return { success: false, error: 'Not found' };

        // Check if used in transactions
        // For now, we allow delete but maybe we should migrate transactions to "Outros" or block?
        // Let's block if used, or handle it.
        // Simple approach: Delete cascade is NOT enabled in schema by default logic I added (or didn't check).
        // Let's safe delete: If used, return error.

        const usageCount = await prisma.financeTransaction.count({
            where: { categoryId: id }
        });

        if (usageCount > 0) {
            return { success: false, error: 'Categoria em uso por transações.' };
        }

        await prisma.financeCategory.delete({ where: { id } });

        revalidatePath('/financeiro');
        return { success: true };

    } catch (error) {
        console.error('Error deleting category:', error);
        return { success: false, error: 'Failed' };
    }
}

export async function seedDefaultCategories(userId?: string) {
    const defaults = [
        { name: 'Alimentação', icon: '🍔', color: '#E74C3C', type: 'EXPENSE' },
        { name: 'Transporte', icon: '🚗', color: '#3498DB', type: 'EXPENSE' },
        { name: 'Moradia', icon: '🏠', color: '#9B59B6', type: 'EXPENSE' },
        { name: 'Lazer', icon: '🎉', color: '#F1C40F', type: 'EXPENSE' },
        { name: 'Saúde', icon: '💊', color: '#2ECC71', type: 'EXPENSE' },
        { name: 'Educação', icon: '📚', color: '#34495E', type: 'EXPENSE' },
        { name: 'Salário', icon: '💰', color: '#27AE60', type: 'INCOME' },
        { name: 'Vendas', icon: '📈', color: '#2980B9', type: 'INCOME' },
        { name: 'Outros', icon: '📝', color: '#95A5A6', type: 'EXPENSE' },
    ];

    try {
        let targetUserId = userId;
        if (!targetUserId) {
            const user = await getFinanceUser();
            if (!user) return { success: false, error: 'Unauthorized' };
            targetUserId = user.id;
        }

        // Check if user has categories
        const count = await prisma.financeCategory.count({ where: { userId: targetUserId } });
        if (count > 0) return { success: true, message: 'Already seeded' };

        for (const cat of defaults) {
            await prisma.financeCategory.create({
                data: { ...cat, userId: targetUserId }
            });
        }
        return { success: true };
    } catch (error) {
        console.error('Error seeding categories:', error);
        return { success: false, error: 'Failed' };
    }
}
