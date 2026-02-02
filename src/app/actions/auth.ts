'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function requestPasswordReset(email: string) {
    if (!email) {
        return { success: false, message: 'E-mail é obrigatório.' };
    }

    try {
        const user = await prisma.user.findFirst({
            where: { email },
        });

        // Always return success to prevent email enumeration, unless debugging
        // But for this MVP, let's be realistic.
        // Actually, for better UX in internal apps, knowing if user exists helps.
        // But security wise, generic is better.
        // Let's assume generic success but log internally.

        if (!user) {
            console.log(`[AUTH] Password reset requested for non-existent email: ${email}`);
            // Wait a bit to simulate processing
            await new Promise(resolve => setTimeout(resolve, 500));
            return { success: true, message: 'Se o e-mail existir, um link será enviado.' };
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

        // Deactivate old tokens?
        // Simple: Create new token entry
        await prisma.passwordResetToken.create({
            data: {
                token,
                email,
                expires
            }
        });

        console.log(`[AUTH] Password Reset Token generated for ${email}: ${token}`);
        console.log(`[AUTH] Link would be: http://localhost:3000/recuperar-senha/${token}`);

        // TODO: Send Email here (NodeMailer, SES, etc)

        return { success: true, message: 'Link de recuperação enviado para o seu e-mail.' };

    } catch (error) {
        console.error('Error requesting password reset:', error);
        return { success: false, message: 'Erro interno ao processar solicitação.' };
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        // Find token
        const storedToken = await prisma.passwordResetToken.findUnique({
            where: { token }
        });

        if (!storedToken) {
            return { success: false, message: 'Token inválido ou expirado.' };
        }

        if (storedToken.expires < new Date()) {
            return { success: false, message: 'Link expirado. Solicite novamente.' };
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: storedToken.email }
        });

        if (!user) {
            return { success: false, message: 'Usuário não encontrado.' };
        }

        // Hash new password
        // Use 10 rounds for salt
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Delete token
        await prisma.passwordResetToken.delete({
            where: { id: storedToken.id }
        });

        return { success: true };

    } catch (error) {
        console.error('Error resetting password:', error);
        return { success: false, message: 'Erro ao redefinir senha.' };
    }
}
