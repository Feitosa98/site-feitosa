'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createFinanceSession } from '@/lib/finance-auth';
import { revalidatePath } from 'next/cache';

export async function loginFinanceUser(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Preencha todos os campos.' };
    }

    try {
        const user = await prisma.financeUser.findUnique({
            where: { email }
        });

        if (!user) {
            return { error: 'E-mail não encontrado.' };
        }

        if (!user.password) {
            return { error: 'Este usuário está configurado apenas para login com Google.' };
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return { error: 'Senha incorreta.' };
        }

        await createFinanceSession(user.id);
        return { success: true };
    } catch (error: any) {
        console.error('Login error:', error);
        return { error: `Erro interno: ${error.message}` };
    }
}

// Optional: Action to manually create a user (or set password) for internal use
// Since there is no public registration, this could be used via console or a hidden admin page later.
export async function createFinanceUser(data: any) {
    // Basic implementation for manual insertion if needed
    try {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const user = await prisma.financeUser.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                image: data.image
            }
        });
        return { success: true, user };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
