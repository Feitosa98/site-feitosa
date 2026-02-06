import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || 'mock_key_for_build';

if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY is not defined, using mock key for build.');
}

export const openai = new OpenAI({
    apiKey: apiKey,
});
