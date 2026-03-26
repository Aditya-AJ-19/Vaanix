import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMProvider, EmbeddingProvider, ChatParams, ChatResponse, ChatChunk } from '../types';

// ===========================
// Google Gemini Provider
// ===========================

const GOOGLE_MODELS = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
];

function getClient(): GoogleGenerativeAI {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error('GOOGLE_AI_API_KEY is not set');
    return new GoogleGenerativeAI(apiKey);
}

export const googleLLM: LLMProvider = {
    id: 'google',
    name: 'Google Gemini',
    models: GOOGLE_MODELS,

    isConfigured(): boolean {
        return !!process.env.GOOGLE_AI_API_KEY;
    },

    async chat(params: ChatParams): Promise<ChatResponse> {
        const client = getClient();
        const model = client.getGenerativeModel({
            model: params.model,
            generationConfig: {
                temperature: params.temperature ?? 0.7,
                maxOutputTokens: params.maxTokens ?? 1024,
                ...(params.stop ? { stopSequences: params.stop } : {}),
            },
        });

        // Convert messages to Gemini format
        // Extract system message and conversation history
        const systemMessage = params.messages.find((m) => m.role === 'system');
        const chatMessages = params.messages.filter((m) => m.role !== 'system');

        const history = chatMessages.slice(0, -1).map((msg) => ({
            role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
            parts: [{ text: msg.content }],
        }));

        const lastMessage = chatMessages[chatMessages.length - 1];
        if (!lastMessage) throw new Error('No user message provided');

        const chat = model.startChat({
            history,
            ...(systemMessage
                ? { systemInstruction: { role: 'user' as const, parts: [{ text: systemMessage.content }] } }
                : {}),
        });

        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response;

        return {
            content: response.text(),
            model: params.model,
            usage: response.usageMetadata
                ? {
                    promptTokens: response.usageMetadata.promptTokenCount ?? 0,
                    completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
                    totalTokens: response.usageMetadata.totalTokenCount ?? 0,
                }
                : undefined,
            finishReason: response.candidates?.[0]?.finishReason ?? undefined,
        };
    },

    async *chatStream(params: ChatParams): AsyncIterable<ChatChunk> {
        const client = getClient();
        const model = client.getGenerativeModel({
            model: params.model,
            generationConfig: {
                temperature: params.temperature ?? 0.7,
                maxOutputTokens: params.maxTokens ?? 1024,
                ...(params.stop ? { stopSequences: params.stop } : {}),
            },
        });

        const systemMessage = params.messages.find((m) => m.role === 'system');
        const chatMessages = params.messages.filter((m) => m.role !== 'system');
        const history = chatMessages.slice(0, -1).map((msg) => ({
            role: msg.role === 'assistant' ? ('model' as const) : ('user' as const),
            parts: [{ text: msg.content }],
        }));

        const lastMessage = chatMessages[chatMessages.length - 1];
        if (!lastMessage) throw new Error('No user message provided');

        const chat = model.startChat({
            history,
            ...(systemMessage
                ? { systemInstruction: { role: 'user' as const, parts: [{ text: systemMessage.content }] } }
                : {}),
        });

        const result = await chat.sendMessageStream(lastMessage.content);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            yield {
                content: text,
                isLast: false,
            };
        }

        // Final chunk
        yield { content: '', isLast: true, finishReason: 'stop' };
    },
};

// ===========================
// Google Embedding Provider
// ===========================

export const googleEmbedding: EmbeddingProvider = {
    id: 'google',
    name: 'Google Gemini Embeddings',
    defaultModel: 'text-embedding-004',
    dimensions: 768,

    isConfigured(): boolean {
        return !!process.env.GOOGLE_AI_API_KEY;
    },

    async embed(texts: string[], model?: string): Promise<number[][]> {
        const client = getClient();
        const embeddingModel = model ?? this.defaultModel;
        const genModel = client.getGenerativeModel({ model: embeddingModel });

        // Google embedContent API supports batch via embedContent calls
        const results: number[][] = [];
        for (const text of texts) {
            const result = await genModel.embedContent(text);
            results.push(result.embedding.values);
        }
        return results;
    },
};
