import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.EMAIL_SERVER_HOST;
const SMTP_PORT = process.env.EMAIL_SERVER_PORT || '587';
const SMTP_USER = process.env.EMAIL_SERVER_USER;
const SMTP_PASS = process.env.EMAIL_SERVER_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM;

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        console.warn('⚠️ Email configuration missing. Email not sent.');
        return false;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: parseInt(SMTP_PORT),
            secure: SMTP_PORT === '465', // true for 465, false for other ports
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: EMAIL_FROM || `"Portal Feitosa" <${SMTP_USER}>`,
            to,
            subject,
            html,
        });

        console.log('✅ Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
}
