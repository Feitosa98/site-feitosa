
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mail';
import { randomBytes } from 'crypto';

export async function addClient(formData: FormData) {
    const data = {
        name: formData.get('name') as string,
        cpfCnpj: formData.get('cpfCnpj') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
    };

    try {
        // 1. Create Client
        const client = await prisma.client.create({ data });

        // 2. Generate Random Password
        const rawPassword = randomBytes(4).toString('hex'); // 8 chars
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 3. Create User Account (Username = digits of CNPJ/CPF, default role = client)
        const username = data.cpfCnpj.replace(/\D/g, '');

        // Handle case where user might already exist (unlikely for new client but possible)
        const existingUser = await prisma.user.findUnique({ where: { username } });

        if (!existingUser) {
            await prisma.user.create({
                data: {
                    name: data.name,
                    username: username,
                    password: hashedPassword,
                    email: data.email,
                    role: 'client',
                    clientId: client.id,
                    mustChangePassword: true
                }
            });

            // 4. Send Welcome Email
            if (data.email) {
                await sendMail({
                    to: data.email,
                    subject: 'Bem-vindo ao Portal Feitosa Soluções',
                    text: `Olá ${data.name},\n\nSeu cadastro foi realizado com sucesso.\n\nAcesse o portal em: ${process.env.NEXTAUTH_URL || 'https://feitosa.com'}\n\nUsuário: ${username}\nSenha Provisória: ${rawPassword}\n\nVocê deverá alterar sua senha no primeiro acesso.`,
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333;">
                            <h2>Bem-vindo ao Portal Feitosa Soluções!</h2>
                            <p>Olá <strong>${data.name}</strong>,</p>
                            <p>Seu cadastro foi realizado com sucesso. Abaixo estão suas credenciais de acesso:</p>
                            <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; display: inline-block;">
                                <p style="margin: 5px 0;"><strong>Link:</strong> <a href="${process.env.NEXTAUTH_URL || 'https://feitosa.com'}">Acessar Portal</a></p>
                                <p style="margin: 5px 0;"><strong>Usuário:</strong> ${username}</p>
                                <p style="margin: 5px 0;"><strong>Senha Provisória:</strong> ${rawPassword}</p>
                            </div>
                            <p style="color: #d32f2f; font-size: 0.9em;">* Por segurança, você será solicitado a alterar esta senha no primeiro login.</p>
                        </div>
                    `
                });
            }
        }

        revalidatePath('/admin/clients');
        return { success: true };
    } catch (e: any) {
        console.error("Erro ao criar cliente:", e);
        return { success: false, error: e.message || 'Erro ao criar cliente.' };
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
