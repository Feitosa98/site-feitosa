import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendMessage, sendVoice, getFileLink, downloadFile } from '@/lib/telegram';
import { randomBytes } from 'crypto';
import { openai, whisperClient, ttsClient } from '@/lib/openai';

// Configurable Model Name (e.g. qwen2.5:0.5b or gpt-4o)
const AI_MODEL = process.env.AI_MODEL || 'qwen2.5:0.5b';

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
    let isVoice = false;

    // 1. Check if user is linked
    const user = await prisma.financeUser.findUnique({
        where: { telegramChatId: chatId }
    });

    // 2. Commands (Start/Link)
    if (text.startsWith('/start')) {
        if (user) {
            // Auto-heal profile
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
        return sendMessage(chatId, `Olá! Para conectar sua conta, envie o comando /link seguido do código.\nEx: /link 123456`);
    }

    if (text.startsWith('/link')) {
        const code = text.split(' ')[1];
        if (!code) return sendMessage(chatId, 'Por favor, envie o código. Ex: /link 123456');

        const userToLink = await prisma.financeUser.findFirst({ where: { telegramConnectCode: code } });
        if (!userToLink) return sendMessage(chatId, 'Código inválido ou expirado.');

        await prisma.financeUser.update({
            where: { id: userToLink.id },
            data: { telegramChatId: chatId, telegramConnectCode: null, telegramName: [message.from.first_name, message.from.last_name].filter(Boolean).join(' '), telegramUsername: message.from.username || '' }
        });
        return sendMessage(chatId, `✅ Conta vinculada! Tente enviar: "Café 5.00"`);
    }

    if (!user) return sendMessage(chatId, 'Sua conta não está vinculada. Envie /start.');

    // 3. Handle Voice (Whisper - Local or Cloud)
    if (message.voice || message.audio) {
        isVoice = true;
        try {
            await sendMessage(chatId, '🎤 Ouvindo (Whisper)...');
            const fileId = (message.voice || message.audio).file_id;
            const fileLink = await getFileLink(fileId);

            if (fileLink) {
                const buffer = await downloadFile(fileLink);
                if (buffer) {
                    const file = new File([new Uint8Array(buffer)], 'audio.ogg', { type: 'audio/ogg' });
                    // Use dedicated whisperClient (points to local or cloud based on .env)
                    const transcription = await whisperClient.audio.transcriptions.create({
                        file: file,
                        model: 'whisper-1', // Generic name, local server handles mapping
                        language: 'pt'
                    });
                    text = transcription.text;
                    await sendMessage(chatId, `📝 *Transcrição:* "${text}"`);
                }
            }
        } catch (error: any) {
            console.error('Whisper Error:', error);
            return sendMessage(chatId, `❌ Erro no áudio: ${error.message || 'Desconhecido'}`);
        }
    }

    // 4. Handle Photo (Local Vision)
    if (message.photo) {
        try {
            await sendMessage(chatId, '👁️ Analisando imagem (Local Vision)...');
            const fileId = message.photo[message.photo.length - 1].file_id;
            const fileLink = await getFileLink(fileId);

            if (fileLink) {
                const buffer = await downloadFile(fileLink);
                if (buffer) {
                    const base64Image = `data:image/jpeg;base64,${buffer.toString('base64')}`;

                    const response = await openai.chat.completions.create({
                        model: 'llama3.2-vision', // Must match the model pulled in docker-compose
                        messages: [
                            {
                                role: "user",
                                content: [
                                    { type: "text", text: "Analise este recibo/imagem. Extraia JSON: { \"description\": string, \"value\": number, \"type\": \"EXPENSE\" }. Se não for recibo, retorne erro." },
                                    { type: "image_url", image_url: { url: base64Image } }
                                ]
                            }
                        ],
                    });

                    const content = response.choices[0].message.content || '{}';
                    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
                    const data = JSON.parse(cleanContent);

                    if (!data.error && data.value) {
                        await createTransaction(user.id, { description: data.description, value: data.value, type: data.type });
                        await sendMessage(chatId, `✅ Comprovante lido: ${data.description} - R$ ${data.value.toFixed(2)}`);
                    } else {
                        await sendMessage(chatId, '❌ Não consegui ler os dados do comprovante.');
                    }
                }
            }
        } catch (e: any) {
            console.error("Vision Error:", e);
            await sendMessage(chatId, `❌ Erro na Visão: ${e.message}`);
        }
    }

    // 5. Handle Text (Regex or Smart Parse with Qwen)
    if (text) {
        // Regex Fallback
        const expenseRegex = /^(.+?)\s+(?:R\$)?\s*(\d+[.,]?\d*)$/i;
        const reverseRegex = /^(?:R\$)?\s*(\d+[.,]?\d*)\s+(.+)$/i;
        let description = '';
        let value = 0;

        const match = text.match(expenseRegex);
        const reverseMatch = text.match(reverseRegex);
        if (match) { description = match[1].trim(); value = parseFloat(match[2].replace(',', '.')); }
        else if (reverseMatch) { value = parseFloat(reverseMatch[1].replace(',', '.')); description = reverseMatch[2].trim(); }

        if (description && !isNaN(value)) {
            await createTransaction(user.id, { description, value });
            const msg = `✅ Salvo: ${description} - R$ ${value.toFixed(2)}`;
            await sendMessage(chatId, msg);
            if (isVoice) await sendAudioResponse(chatId, msg);
            return;
        }

        // Smart Parse (Qwen / GPT)
        try {
            const response = await openai.chat.completions.create({
                model: AI_MODEL, // e.g. qwen2.5:0.5b
                messages: [
                    { role: "system", content: "Você é um motor de processamento financeiro. Sua resposta DEVE SER UM JSON VÁLIDO. Não inclua markdown ou explicações. Se a entrada não for uma transação financeira clara (ex: 'Oi', 'Teste'), retorne: { \"error\": true, \"message\": \"Sua resposta curta e amigável aqui\" }. Se for transação, extraia: { \"description\": string, \"value\": number, \"type\": \"INCOME\" | \"EXPENSE\", \"installments\": number, \"creditCard\": string, \"dueDate\": string }." },
                    { role: "user", content: `Analise: "${text}"` }
                ],
            });

            const content = response.choices[0].message.content || '{}';
            console.log("🤖 AI Raw Response:", content);

            // Robust JSON extraction (find first '{' and last '}')
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const cleanContent = jsonMatch ? jsonMatch[0] : '{}';

            let data;
            try {
                data = JSON.parse(cleanContent);
            } catch (e) {
                console.error("JSON Parse Error. Raw:", content);
                await sendMessage(chatId, "❌ A IA se confundiu. Tente ser mais específico. Ex: 'Gastei 50 no almoço'");
                return;
            }

            if (data.error) {
                await sendMessage(chatId, data.message || '🤔 Não entendi. Tente "Almoço 20".');
                return;
            }

            if (!data.error && data.value) {
                let cleanValue = data.value;
                if (typeof cleanValue === 'string') {
                    cleanValue = parseFloat(cleanValue.replace(/[^\d.,]/g, '').replace(',', '.'));
                }

                if (isNaN(cleanValue)) throw new Error("Valor inválido retornado pela IA");

                await createTransaction(user.id, data);

                const icon = data.type === 'INCOME' ? '💰' : '💸';
                let extraInfo = '';
                if (data.installments) extraInfo += ` (em ${data.installments}x)`;
                if (data.creditCard) extraInfo += ` [${data.creditCard}]`;

                const msg = `✅ ${icon} Inteligente: ${data.description}${extraInfo} - R$ ${cleanValue.toFixed(2)}`;
                await sendMessage(chatId, msg);
                if (isVoice) await sendAudioResponse(chatId, `Entendido! Salvei ${data.description}.`);
            } else {
                await sendMessage(chatId, '🤔 Não entendi. Tente "Almoço 20".');
            }
        } catch (e: any) {
            console.error("Smart Parse Error", e);
            await sendMessage(chatId, `❌ Algo deu errado ao processar a mensagem. Tente novamente mais simples.`);
        }
    }
}

async function sendAudioResponse(chatId: string, text: string) {
    try {
        const mp3 = await ttsClient.audio.speech.create({
            model: 'kokoro',
            voice: 'alloy',
            input: text,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await sendVoice(chatId, buffer);
    } catch (e) {
        console.error("TTS Error:", e);
    }
}

async function createTransaction(userId: string, data: any) {
    let { description, value, type = 'EXPENSE', installments, creditCard, dueDate } = data;

    // Income Logic
    const incomeKeywords = ['ganhei', 'recebi', 'entrada', 'lucro', 'venda', 'deposito', 'pix recebido'];
    if (type === 'EXPENSE') {
        const lowerDesc = description.toLowerCase();
        if (incomeKeywords.some(k => lowerDesc.startsWith(k))) type = 'INCOME';
    }
    const category = type === 'INCOME' ? 'VENDAS' : 'OUTROS';

    // Credit Card Logic
    let creditCardId = null;
    let status = 'PAID';

    if (creditCard) {
        const card = await prisma.financeCreditCard.findFirst({
            where: {
                userId,
                name: { contains: creditCard, mode: 'insensitive' }
            }
        });
        if (card) {
            creditCardId = card.id;
            status = 'PENDING'; // Credit card purchases are pending until invoice payment
        }
    }

    // Installments Logic
    if (installments && installments > 1) {
        const installmentValue = value / installments;
        for (let i = 1; i <= installments; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() + (i - 1));

            await prisma.financeTransaction.create({
                data: {
                    userId,
                    description: `${description} (${i}/${installments})`,
                    value: installmentValue,
                    type,
                    category,
                    date: date,
                    status: creditCardId ? 'PENDING' : 'PAID', // Future installments are pending/scheduled? Actually usually pending if card.
                    creditCardId,
                    installmentNumber: i,
                    totalInstallments: installments,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes: 'Via Telegram (AI) - Parcelado'
                }
            });
        }
    } else {
        await prisma.financeTransaction.create({
            data: {
                userId,
                description,
                value,
                type,
                category,
                date: new Date(),
                status,
                creditCardId,
                dueDate: dueDate ? new Date(dueDate) : null,
                notes: 'Via Telegram (AI)'
            }
        });
    }
}
