import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
    // 1. Try to get settings from DB
    let smtpHost = process.env.EMAIL_SERVER_HOST;
    let smtpPort = process.env.EMAIL_SERVER_PORT || '587';
    let smtpUser = process.env.EMAIL_SERVER_USER;
    let smtpPass = process.env.EMAIL_SERVER_PASSWORD;
    let emailFrom = process.env.EMAIL_FROM;

    try {
        const settings = await prisma.settings.findUnique({
            where: { id: 'settings' } // Assuming singleton setting row with fixed ID
        });

        if (settings?.emailEnabled) {
            if (settings.smtpHost) smtpHost = settings.smtpHost;
            if (settings.smtpPort) smtpPort = settings.smtpPort;
            if (settings.smtpUser) smtpUser = settings.smtpUser;
            if (settings.smtpPassword) smtpPass = settings.smtpPassword;
            if (settings.smtpFrom) emailFrom = settings.smtpFrom;
        }
    } catch (e) {
        console.warn('Unable to fetch settings from DB, using env fallback');
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn('⚠️ Email configuration missing. Email not sent.');
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort),
            secure: smtpPort === '465',
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
        });

        const info = await transporter.sendMail({
            from: emailFrom || `"Portal Feitosa" <${smtpUser}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('✅ Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
}
