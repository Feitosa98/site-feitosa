import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || 'local-key';

// Main OpenAI Client (or Local LLM if configured)
export const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: process.env.AI_BASE_URL || 'http://local_ai_ollama:11434/v1'
});

// Dedicated Client for Whisper (can be same as main or separate local service)
export const whisperClient = new OpenAI({
    apiKey: process.env.WHISPER_API_KEY || 'local-whisper-key',
    baseURL: process.env.WHISPER_BASE_URL || 'http://local_ai_whisper:9000/v1'
});

// Dedicated Client for TTS (Kokoro)
export const ttsClient = new OpenAI({
    apiKey: process.env.KOKORO_API_KEY || 'local-kokoro-key',
    baseURL: process.env.KOKORO_BASE_URL || 'http://local_ai_kokoro:8880/v1'
});
