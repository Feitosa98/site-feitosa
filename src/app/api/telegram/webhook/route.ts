import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage, getFileLink, downloadFile } from '@/lib/telegram';
import { randomBytes } from 'crypto';
import { openai } from '@/lib/openai';

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
    let text = message.text || message.caption || '';

    // 1. Check if user is linked
    const user = await prisma.financeUser.findUnique({
        where: { telegramChatId: chatId }
    });

    // 2. Commands
    if (text.startsWith('/start')) {
        console.log(' Telegram: Handling /start for chat', chatId);
        if (user) {
            // Auto-heal: Update profile info if missing
            const currentName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ');
            const currentUsername = message.from.username || '';

            if (user.telegramName !== currentName || user.telegramUsername !== currentUsername) {
                await prisma.financeUser.update({
                    where: { id: user.id },
                    data: { telegramName: currentName, telegramUsername: currentUsername }
                });
            }

            return sendMessage(chatId, `Bem-vindo de volta, ${user.name}! 🚀\n\nEnvie uma despesa como "Almoço 30.00", uma nota de voz ou uma foto de recibo.`);
        }

        return sendMessage(chatId, `Olá! Para conectar sua conta, envie o comando /link seguido do código exibido no seu Painel Financeiro.\n\nExemplo: /link 123456\n\n(Vá em Configurações > Telegram no painel para gerar o código)`);
    }

    if (text.startsWith('/link')) {
        const code = text.split(' ')[1];
        if (!code) return sendMessage(chatId, 'Por favor, envie o código. Ex: /link 123456');

        const userToLink = await prisma.financeUser.findFirst({
            where: { telegramConnectCode: code }
        });

        if (!userToLink) {
            return sendMessage(chatId, 'Código inválido ou expirado. Gere um novo no painel.');
        }

        const telegramName = [message.from.first_name, message.from.last_name].filter(Boolean).join(' ');
        const telegramUsername = message.from.username || '';

        await prisma.financeUser.update({
            where: { id: userToLink.id },
            data: {
                telegramChatId: chatId,
                telegramConnectCode: null,
                telegramName,
                telegramUsername
            }
        });

        return sendMessage(chatId, `✅ Conta vinculada com sucesso! Olá, ${userToLink.name}. \n\nAgora você pode enviar despesas por aqui.\n\nTente enviar: "Café 5.00"`);
    }

    if (!user) {
        return sendMessage(chatId, 'Sua conta não está vinculada. Envie /start para instruções.');
    }

    // 3. Handle Voice (Whisper)
    if (message.voice || message.audio) {
        try {
            await sendMessage(chatId, '🎤 Ouvindo...');
            const fileId = (message.voice || message.audio).file_id;
            const fileLink = await getFileLink(fileId);

            if (fileLink) {
                const buffer = await downloadFile(fileLink);
                if (buffer) {
                    // Create a File object from buffer for OpenAI
                    const file = new File([buffer], 'audio.ogg', { type: 'audio/ogg' });

                    const transcription = await openai.audio.transcriptions.create({
                        file: file,
                        model: 'whisper-1',
                        language: 'pt'
                    });

                    text = transcription.text;
                    await sendMessage(chatId, `📝 *Transcrição:* "${text}"`);
                }
            }
        } catch (error) {
            console.error('Whisper Error:', error);
            return sendMessage(chatId, '❌ Erro ao processar áudio.');
        }
    }

    // 4. Handle Photo (GPT-4o Vision)
    if (message.photo) {
        try {
            await sendMessage(chatId, '👀 Analisando recibo...');
            const fileId = message.photo[message.photo.length - 1].file_id;
            const fileLink = await getFileLink(fileId);

            if (fileLink) {
                const response = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Analyze this receipt image. Extract the Merchant Name (as description), Total Value, and Date. Return strictly a JSON object: { \"description\": string, \"value\": number, \"date\": string (ISO format YYYY-MM-DD) }. If date is missing, use today. If value is unclear, use 0." },
                                {
                                    type: "image_url",
                                    image_url: {
                                        "url": fileLink,
                                    },
                                },
                            ],
                        },
                    ],
                    response_format: { type: "json_object" }
                });

                const content = response.choices[0].message.content;
                if (content) {
                    const data = JSON.parse(content);
                    await prisma.financeTransaction.create({
                        data: {
                            userId: user.id,
                            description: data.description || 'Recibo (Auto)',
                            value: data.value || 0,
                            type: 'EXPENSE',
                            category: 'OUTROS',
                            date: new Date(data.date),
                            status: 'PAID',
                            notes: `Recibo via AI. Imagem: ${fileLink}`
                        }
                    });
                    return sendMessage(chatId, `✅ Recibo salvo!\n\n🏢 ${data.description}\n💲 R$ ${data.value?.toFixed(2)}\n📅 ${data.date}`);
                }
            }
        } catch (error) {
            console.error('Vision Error:', error);
            return sendMessage(chatId, '❌ Erro ao analisar imagem.');
        }
    }

    // 5. Handle Text (Regex or Smart Parse)
    if (text) {
        // Simple Regex First: "Item 10" or "Item 10.90"
        const expenseRegex = /^(.+?)\s+(?:R\$)?\s*(\d+[.,]?\d*)$/i;
        const match = text.match(expenseRegex);

        if (match) {
            const description = match[1].trim();
            const value = parseFloat(match[2].replace(',', '.'));

            if (!isNaN(value)) {
                await createTransaction(user.id, description, value);
                return sendMessage(chatId, `✅ Salvo: ${description} - R$ ${value.toFixed(2)}`);
            }
        }

        // Fallback: Smart Parse with GPT-4o-mini
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a financial assistant. Extract transaction details from the user text. Return JSON: { \"description\": string, \"value\": number, \"type\": \"INCOME\" | \"EXPENSE\" }. If text is not a transaction, return { \"error\": true }." },
                    { role: "user", content: text }
                ],
                response_format: { type: "json_object" }
            });

            const content = response.choices[0].message.content;
            if (content) {
                const data = JSON.parse(content);
                if (!data.error && data.value) {
                    await createTransaction(user.id, data.description, data.value, data.type);
                    const icon = data.type === 'INCOME' ? '💰' : '💸';
                    return sendMessage(chatId, `✅ ${icon} Inteligente: ${data.description} - R$ ${data.value.toFixed(2)}`);
                }
            }
        } catch (e) {
            console.error("Smart Parse Error", e);
        }

        return sendMessage(chatId, '🤔 Não entendi. Tente "Almoço 20" ou envie uma foto/áudio.');
    }
}

async function createTransaction(userId: string, description: string, value: number, type: 'INCOME' | 'EXPENSE' = 'EXPENSE') {
    const incomeKeywords = ['ganhei', 'recebi', 'entrada', 'lucro', 'venda', 'deposito', 'pix recebido'];

    // Auto-detect type if not specified by AI
    if (type === 'EXPENSE') {
        const lowerDesc = description.toLowerCase();
        if (incomeKeywords.some(k => lowerDesc.startsWith(k))) {
            type = 'INCOME';
        }
    }

    const category = type === 'INCOME' ? 'VENDAS' : 'OUTROS';

    await prisma.financeTransaction.create({
        data: {
            userId,
            description,
            value,
            type,
            category,
            date: new Date(),
            status: 'PAID',
            notes: 'Via Telegram'
        }
    });
}
