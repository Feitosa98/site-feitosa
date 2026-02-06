
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

export async function sendMessage(chatId: string, text: string, options: any = {}) {
    if (!TELEGRAM_TOKEN) {
        console.error(' Telegram: Token missing!');
        return;
    }

    console.log(' Telegram: Sending message to', chatId, text.substring(0, 20) + '...');

    try {
        const res = await fetch(`${BASE_URL}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                ...options
            })
        });
        const data = await res.json();
        if (!data.ok) {
            console.error(' Telegram: Send failed:', JSON.stringify(data));
        } else {
            console.log(' Telegram: Message sent successfully');
        }
    } catch (error) {
        console.error('Telegram sendMessage error:', error);
    }
}

export async function sendVoice(chatId: string, audioBuffer: Buffer) {
    if (!TELEGRAM_TOKEN) return;

    try {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('voice', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/ogg' }), 'response.ogg');

        const res = await fetch(`${BASE_URL}/sendVoice`, {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (!data.ok) {
            console.error('Telegram sendVoice failed:', JSON.stringify(data));
        }
    } catch (error) {
        console.error('Telegram sendVoice error:', error);
    }
}

export async function getFileLink(fileId: string) {
    if (!TELEGRAM_TOKEN) return null;

    try {
        const response = await fetch(`${BASE_URL}/getFile?file_id=${fileId}`);
        const data = await response.json();

        if (data.ok && data.result.file_path) {
            return `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${data.result.file_path}`;
        }
    } catch (error) {
        console.error('Telegram getFile error:', error);
    }
    return null;
}

export async function downloadFile(url: string): Promise<Buffer | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        console.error('Telegram downloadFile error:', error);
        return null;
    }
}

export async function setWebhook(url: string) {
    if (!TELEGRAM_TOKEN) return;

    try {
        const response = await fetch(`${BASE_URL}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await response.json();
        console.log('Set Webhook:', data);
        return data;
    } catch (error) {
        console.error('Telegram setWebhook error:', error);
    }
}
