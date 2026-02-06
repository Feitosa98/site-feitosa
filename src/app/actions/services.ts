'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { ServiceSchema } from '@/lib/schemas';
import { revalidatePath } from 'next/cache';

export async function getServices() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        throw new Error('Unauthorized');
    }

    return await prisma.service.findMany({
        where: { active: true },
        orderBy: { name: 'asc' }
    });
}

export async function getService(id: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        throw new Error('Unauthorized');
    }

    return await prisma.service.findUnique({
        where: { id }
    });
}

export async function saveService(formData: FormData) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        return { success: false, message: 'Unauthorized' };
    }

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const valueRaw = formData.get('value') as string;
    const value = parseFloat(valueRaw ? valueRaw.replace('R$', '').replace('.', '').replace(',', '.') : '0');

    const serviceCode = formData.get('serviceCode') as string;

    const rawData = {
        name,
        description,
        value,
        serviceCode,
        active: true
    };

    // Zod Validation
    const result = ServiceSchema.safeParse(rawData);

    if (!result.success) {
        // Zod 'safeParse' error matches
        return { success: false, message: result.error.issues[0].message };
    }

    const data = result.data;

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
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        return { success: false, message: 'Unauthorized' };
    }

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
