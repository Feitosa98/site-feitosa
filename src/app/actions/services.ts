'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getServices() {
    return await prisma.service.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
    });
}

export async function getService(id: string) {
    return await prisma.service.findUnique({
        where: { id }
    });
}

export async function saveService(formData: FormData) {
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const value = parseFloat((formData.get('value') as string).replace('R$', '').replace('.', '').replace(',', '.'));
    const serviceCode = formData.get('serviceCode') as string;

    const data = {
        name,
        description,
        value,
        serviceCode,
        active: true
    };

    try {
        if (id) {
            await prisma.service.update({
                where: { id },
                data
            });
        } else {
            await prisma.service.create({
                data
            });
        }

        revalidatePath('/admin/services');
        revalidatePath('/admin/charges/new');
        return { success: true, message: 'Serviço salvo com sucesso!' };
    } catch (error: any) {
        console.error('Error saving service:', error);
        return { success: false, message: `Erro ao salvar serviço: ${error.message}` };
    }
}

export async function deleteService(id: string) {
    try {
        // Soft delete
        await prisma.service.update({
            where: { id },
            data: { active: false }
        });

        revalidatePath('/admin/services');
        return { success: true, message: 'Serviço removido com sucesso!' };
    } catch (error: any) {
        return { success: false, message: `Erro ao remover serviço: ${error.message}` };
    }
}
