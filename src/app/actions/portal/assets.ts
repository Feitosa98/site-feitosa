'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

export async function createAsset(data: any) {
    try {
        const session = await auth();
        const user = session?.user as any;

        if (!user || !user.clientId) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.asset.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                value: parseFloat(data.value) || 0,
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
                status: data.status || 'ATIVO',
                clientId: user.clientId
            }
        });

        revalidatePath('/portal/inventario');
        return { success: true };
    } catch (error: any) {
        console.error('Error creating asset:', error);
        return { success: false, error: 'Erro ao criar ativo' };
    }
}

export async function updateAsset(id: string, data: any) {
    try {
        const session = await auth();
        const user = session?.user as any;

        if (!user || !user.clientId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Verify ownership
        const existingAsset = await prisma.asset.findFirst({
            where: {
                id,
                clientId: user.clientId
            }
        });

        if (!existingAsset) {
            return { success: false, error: 'Asset not found or unauthorized' };
        }

        await prisma.asset.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code,
                description: data.description,
                value: parseFloat(data.value) || 0,
                purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
                status: data.status
            }
        });

        revalidatePath('/portal/inventario');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating asset:', error);
        return { success: false, error: 'Erro ao atualizar ativo' };
    }
}
