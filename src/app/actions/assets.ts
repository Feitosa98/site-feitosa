'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getAssets(clientId?: string) {
    try {
        if (clientId) {
            return await prisma.asset.findMany({
                where: { clientId },
                orderBy: { createdAt: 'desc' }
            });
        }
        return await prisma.asset.findMany({
            include: { client: true },
            orderBy: { createdAt: 'desc' }
        });
    } catch (error) {
        console.error('Error fetching assets:', error);
        return [];
    }
}

export async function saveAsset(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const description = formData.get('description') as string;
    const status = formData.get('status') as string;
    const value = parseFloat(formData.get('value') as string) || 0;
    const purchaseDate = formData.get('purchaseDate') ? new Date(formData.get('purchaseDate') as string) : null;
    const clientId = formData.get('clientId') as string;

    try {
        if (id) {
            await prisma.asset.update({
                where: { id },
                data: {
                    name,
                    code,
                    description,
                    status,
                    value,
                    purchaseDate,
                    clientId
                }
            });
        } else {
            await prisma.asset.create({
                data: {
                    name,
                    code,
                    description,
                    status,
                    value,
                    purchaseDate,
                    clientId
                }
            });
        }

        revalidatePath('/admin/inventario');
        revalidatePath('/portal/inventario');
        return { success: true, message: 'Ativo salvo com sucesso!' };
    } catch (error: any) {
        console.error('Error saving asset:', error);
        return { success: false, message: `Erro ao salvar ativo: ${error.message}` };
    }
}

export async function deleteAsset(id: string) {
    try {
        await prisma.asset.delete({
            where: { id }
        });
        revalidatePath('/admin/inventario');
        revalidatePath('/portal/inventario');
        return { success: true, message: 'Ativo excluído com sucesso!' };
    } catch (error: any) {
        console.error('Error deleting asset:', error);
        return { success: false, message: `Erro ao excluir ativo: ${error.message}` };
    }
}
