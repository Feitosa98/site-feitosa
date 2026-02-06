import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage, getFileLink } from '@/lib/telegram';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const update = await req.json();

        if (update.message) {
            console.log(' Telegram: Received message:', JSON.stringify(update.message, null, 2));
            await handleMessage(update.message);
        } else {
            console.log(' Telegram: Received update without message:', JSON.stringify(update, null, 2));
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram Webhook Error:', error);
        return NextResponse.json({ ok: false, error: 'Internal Error' }, { status: 500 });
    }
}

async function handleMessage(message: any) {
    const chatId = message.chat.id.toString();
    const text = message.text || message.caption || '';

    // 1. Check if user is linked
    const user = await prisma.financeUser.findUnique({
        where: { telegramChatId: chatId }
    });

    // 2. Commands
    if (text.startsWith('/start')) {
        console.log(' Telegram: Handling /start for chat', chatId);
        if (user) {
            return sendMessage(chatId, `Bem-vindo de volta, ${user.name}! 🚀\n\nEnvie uma despesa como "Almoço 30.00" ou uma foto de recibo.`);
        }

        // Generate link code
        const code = randomBytes(4).toString('hex').toUpperCase();

        // Temporary store code? Or explain how to link
        // Since we don't have a session here, we need the USER to generate the code in the webapp and send it here, or vice versa (easier: user sends code here generated on web).

        // Let's assume simpler flow: User initiates on Web, gets a code, sends code here.
        // OR: User sends /link on Telegram, gets a code, enters it on Web.

        return sendMessage(chatId, `Olá! Para conectar sua conta, envie o comando /link seguido do código exibido no seu Painel Financeiro.\n\nExemplo: /link 123456\n\n(Vá em Configurações > Telegram no painel para gerar o código)`);
    }

    if (text.startsWith('/link')) {
        const code = text.split(' ')[1];
        if (!code) return sendMessage(chatId, 'Por favor, envie o código. Ex: /link 123456');

        const userToLink = await prisma.financeUser.findFirst({
            where: { telegramConnectCode: code }
        });

        if (!userToLink) {
            console.log(' Telegram: Code invalid or expired:', code);
            return sendMessage(chatId, 'Código inválido ou expirado. Gere um novo no painel.');
        }

        console.log(' Telegram: Linking user:', userToLink.email);

        const telegramName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ');
        const telegramUsername = message.from.username || '';

        await prisma.financeUser.update({
            where: { id: userToLink.id },
            data: {
                telegramChatId: chatId,
                telegramConnectCode: null, // Consume code
                telegramName,
                telegramUsername
            }
        });

        return sendMessage(chatId, `✅ Conta vinculada com sucesso! Olá, ${userToLink.name}. \n\nAgora você pode enviar despesas por aqui.\n\nTente enviar: "Café 5.00"`);
    }

    if (!user) {
        return sendMessage(chatId, 'Sua conta não está vinculada. Envie /start para instruções.');
    }

    // 3. Handle Expense Text (Regex: Description Value)
    // Matches: "Item 10", "Item 10,90", "Item 10.90", "R$ 10", etc.
    const expenseRegex = /^(.+?)\s+(?:R\$)?\s*(\d+[.,]?\d*)$/i;
    const match = text.match(expenseRegex);

    if (match) {
        const description = match[1].trim();
        let valueStr = match[2].replace(',', '.');
        const value = parseFloat(valueStr);

        if (isNaN(value)) return sendMessage(chatId, '❌ Valor inválido.');

        await prisma.financeTransaction.create({
            data: {
                userId: user.id,
                description,
                value,
                type: 'EXPENSE',
                category: 'OUTROS',
                date: new Date(),
                status: 'PAID',
                notes: 'Via Telegram'
            }
        });

        return sendMessage(chatId, `✅ Despesa salva!\n\n📝: ${description}\n💲: R$ ${value.toFixed(2)}`);
    }

    // 4. Handle Photo
    if (message.photo) {
        const fileId = message.photo[message.photo.length - 1].file_id;
        const fileLink = await getFileLink(fileId);

        if (fileLink) {
            await prisma.financeTransaction.create({
                data: {
                    userId: user.id,
                    description: text || 'Recibo (Foto)',
                    value: 0, // Pending review
                    type: 'EXPENSE',
                    category: 'OUTROS',
                    date: new Date(),
                    status: 'PENDING', // Mark as pending review if value is 0
                    notes: `Link imagem: ${fileLink}`
                }
            });
            return sendMessage(chatId, '📸 Recibo salvo! (Valor R$ 0,00 - Edite no painel)');
        }
    }

    // 5. Handle Audio (Voice)
    if (message.voice || message.audio) {
        // Implement OpenAI Whisper integration here eventually
        // For now:
        return sendMessage(chatId, '🎤 Áudio recebido! Em breve transcreverei isso para você. (Funcionalidade em desenvolvimento)');
    }

    return sendMessage(chatId, '🤔 Não entendi. Tente enviar "Item Valor" (ex: Almoço 20).');
}
