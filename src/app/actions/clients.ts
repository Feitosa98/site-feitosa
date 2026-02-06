
'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

import bcrypt from 'bcryptjs';
import { sendMail } from '@/lib/mail';
import { randomBytes } from 'crypto';

export async function addClient(formData: FormData) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
    }

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
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; }
                                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                                .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px 20px; text-align: center; }
                                .logo { max-height: 60px; }
                                .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
                                .h1 { color: #1e293b; font-size: 24px; margin-bottom: 20px; font-weight: 600; }
                                .highlight-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; }
                                .credential-row { margin: 10px 0; font-size: 16px; }
                                .label { color: #64748b; font-weight: 500; min-width: 80px; display: inline-block; }
                                .value { color: #0f172a; font-weight: 600; font-family: 'Courier New', monospace; }
                                .btn { display: block; width: fit-content; margin: 30px auto 0; background-color: #2563eb; color: #ffffff !important; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; }
                                .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <img src="${process.env.NEXTAUTH_URL}/assets/img/logo.png" alt="Feitosa Soluções" class="logo" style="max-height: 60px;">
                                </div>
                                <div class="content">
                                    <h1 class="h1">Bem-vindo(a), ${data.name}!</h1>
                                    <p>Seu cadastro no <strong>Portal Feitosa Soluções</strong> foi realizado com sucesso.</p>
                                    <p>Abaixo estão suas credenciais provisórias para o primeiro acesso:</p>
                                    
                                    <div class="highlight-box">
                                        <div class="credential-row">
                                            <span class="label">Usuário:</span>
                                            <span class="value">${username}</span>
                                        </div>
                                        <div class="credential-row">
                                            <span class="label">Senha:</span>
                                            <span class="value">${rawPassword}</span>
                                        </div>
                                    </div>

                                    <a href="${process.env.NEXTAUTH_URL || 'https://feitosa.com'}" class="btn">Acessar Portal Agora</a>
                                    
                                    <p style="margin-top: 30px; font-size: 14px; color: #ef4444;">
                                        🔒 <strong>Importante:</strong> Por segurança, você será solicitado a criar uma nova senha pessoal assim que entrar.
                                    </p>
                                </div>
                                <div class="footer">
                                    <p>© ${new Date().getFullYear()} Feitosa Soluções em Informática. Todos os direitos reservados.</p>
                                    <p>Não responda a este email. Em caso de dúvidas, contate o suporte.</p>
                                </div>
                            </div>
                        </body>
                        </html>
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

export async function updateClient(id: string, formData: FormData) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
    }

    const data = {
        name: formData.get('name') as string,
        cpfCnpj: formData.get('cpfCnpj') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
    };

    try {
        await prisma.client.update({
            where: { id },
            data
        });

        // Also update the associated user if exists
        const user = await prisma.user.findFirst({ where: { clientId: id } });
        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: data.name,
                    email: data.email
                }
            });
        }

        revalidatePath('/admin/clients');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: 'Erro ao atualizar cliente.' };
    }
}

export async function resetClientPassword(clientId: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const user = await prisma.user.findFirst({ where: { clientId } });

        if (!user) {
            return { success: false, error: 'Usuário não encontrado para este cliente.' };
        }

        // Generate Random Password
        const rawPassword = randomBytes(4).toString('hex'); // 8 chars
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                mustChangePassword: true
            }
        });

        // Send Email
        if (user.email) {
            await sendMail({
                to: user.email,
                subject: 'Redefinição de Senha - Portal Feitosa Soluções',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; }
                            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px 20px; text-align: center; }
                            .logo { max-height: 60px; }
                            .content { padding: 40px 30px; color: #334155; line-height: 1.6; }
                            .h1 { color: #1e293b; font-size: 24px; margin-bottom: 20px; font-weight: 600; }
                            .highlight-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; }
                            .credential-row { margin: 10px 0; font-size: 16px; }
                            .label { color: #64748b; font-weight: 500; min-width: 80px; display: inline-block; }
                            .value { color: #0f172a; font-weight: 600; font-family: 'Courier New', monospace; }
                            .btn { display: block; width: fit-content; margin: 30px auto 0; background-color: #2563eb; color: #ffffff !important; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; text-align: center; }
                            .footer { background-color: #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <img src="${process.env.NEXTAUTH_URL}/assets/img/logo.png" alt="Feitosa Soluções" class="logo" style="max-height: 60px;">
                            </div>
                            <div class="content">
                                <h1 class="h1">Senha Redefinida</h1>
                                <p>Olá <strong>${user.name}</strong>,</p>
                                <p>Sua senha de acesso ao <strong>Portal Feitosa Soluções</strong> foi redefinida pelo administrador.</p>
                                
                                <div class="highlight-box">
                                    <div class="credential-row">
                                        <span class="label">Usuário:</span>
                                        <span class="value">${user.username}</span>
                                    </div>
                                    <div class="credential-row">
                                        <span class="label">Nova Senha:</span>
                                        <span class="value">${rawPassword}</span>
                                    </div>
                                </div>

                                <a href="${process.env.NEXTAUTH_URL || 'https://feitosa.com'}" class="btn">Acessar Portal</a>
                                
                                <p style="margin-top: 30px; font-size: 14px; color: #ef4444;">
                                    🔒 <strong>Importante:</strong> Você deverá alterar esta senha assim que entrar.
                                </p>
                            </div>
                            <div class="footer">
                                <p>© ${new Date().getFullYear()} Feitosa Soluções em Informática.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });
        }

        return { success: true };
    } catch (e) {
        console.error("Erro reset senha:", e);
        return { success: false, error: 'Erro ao resetar senha.' };
    }
}

export async function deleteClient(id: string) {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        throw new Error('Unauthorized');
    }
    await prisma.client.delete({ where: { id } });
    revalidatePath('/admin/clients');
}

export async function getClients() {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== 'admin') {
        return [];
    }

    // Basic validation to avoid crashes if DB not accessible
    try {
        return await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
    } catch (e) {
        console.error("DB Error:", e);
        return [];
    }
}
