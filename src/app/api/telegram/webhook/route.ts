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
                        await createTransaction(user.id, data.description, data.value, data.type);
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
            await createTransaction(user.id, description, value);
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
                    { role: "system", content: "Você é um assistente financeiro. O usuário enviará um texto sobre uma transação. Extraia um JSON específico: { \"description\": string, \"value\": number, \"type\": \"INCOME\" | \"EXPENSE\" }. Se não for uma transação, retorne { \"error\": true }. Responda APENAS o JSON." },
                    { role: "user", content: text }
                ],
            });

            const content = response.choices[0].message.content || '{}';
            // Sanitize JSON (sometimes models add markdown backticks)
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanContent);

            if (!data.error && data.value) {
                // Ensure value is a number (handle "150g", "R$ 150,00", etc)
                let cleanValue = data.value;
                if (typeof cleanValue === 'string') {
                    cleanValue = parseFloat(cleanValue.replace(/[^\d.,]/g, '').replace(',', '.'));
                }

                if (isNaN(cleanValue)) throw new Error("Valor inválido retornado pela IA");

                await createTransaction(user.id, data.description, cleanValue, data.type);
                const icon = data.type === 'INCOME' ? '💰' : '💸';
                const msg = `✅ ${icon} Inteligente: ${data.description} - R$ ${cleanValue.toFixed(2)}`;
                await sendMessage(chatId, msg);
                if (isVoice) await sendAudioResponse(chatId, `Entendido! Salvei ${data.description} de ${cleanValue} reais.`);
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
            model: 'kokoro', // or 'tts-1' if generic
            voice: 'alloy', // specific voice needed for Kokoro? check docs. using standard placeholder
            input: text,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        await sendVoice(chatId, buffer);
    } catch (e) {
        console.error("TTS Error:", e);
    }
}

async function createTransaction(userId: string, description: string, value: number, type: 'INCOME' | 'EXPENSE' = 'EXPENSE') {
    const incomeKeywords = ['ganhei', 'recebi', 'entrada', 'lucro', 'venda', 'deposito', 'pix recebido'];
    if (type === 'EXPENSE') {
        const lowerDesc = description.toLowerCase();
        if (incomeKeywords.some(k => lowerDesc.startsWith(k))) type = 'INCOME';
    }
    const category = type === 'INCOME' ? 'VENDAS' : 'OUTROS';
    await prisma.financeTransaction.create({
        data: { userId, description, value, type, category, date: new Date(), status: 'PAID', notes: 'Via Telegram (AI)' }
    });
}
