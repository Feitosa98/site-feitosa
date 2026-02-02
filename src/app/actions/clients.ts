
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addClient(formData: FormData) {
    const data = {
        name: formData.get('name') as string,
        cpfCnpj: formData.get('cpfCnpj') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
    };

    try {
        await prisma.client.create({ data });
        revalidatePath('/admin/clients');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Erro ao criar cliente. CPF/CNPJ pode já existir.' };
    }
}

export async function deleteClient(id: string) {
    await prisma.client.delete({ where: { id } });
    revalidatePath('/admin/clients');
}

export async function getClients() {
    // Basic validation to avoid crashes if DB not accessible
    try {
        return await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {
        console.error("DB Error:", e);
        return [];
    }
}
