import OpenAI from 'openai';
import type { LLMProvider, EmbeddingProvider, ChatParams, ChatResponse, ChatChunk } from '../types';

// ===========================
// OpenAI Provider
// ===========================

const OPENAI_MODELS = [
    'gpt-4o',
    'gpt-4o-mini',
    'gpt-4-turbo',
    'gpt-3.5-turbo',
    'o1-mini',
    'o3-mini',
];

const EMBEDDING_MODELS: Record<string, number> = {
    'text-embedding-3-small': 1536,
    'text-embedding-3-large': 3072,
    'text-embedding-ada-002': 1536,
};

/**
 * Get OpenAI client for LLM (chat) operations.
 * Uses OPENAI_BASE_URL if set (allows custom/proxy endpoints).
 */
function getClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    return new OpenAI({ baseURL: baseUrl, apiKey });
}

/**
 * Get OpenAI client for embedding operations.
 * Uses OPENAI_EMBEDDING_BASE_URL if set, otherwise defaults to the
 * official OpenAI API (ignores OPENAI_BASE_URL).
 *
 * This separation is necessary because custom/proxy OpenAI-compatible
 * servers (e.g. LM Studio, Ollama, vLLM) often do NOT support the
 * /v1/embeddings endpoint, which causes a "404 page not found" error.
 */
function getEmbeddingClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log(`api key = ${apiKey}`);

    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    // Only use a custom base URL if OPENAI_EMBEDDING_BASE_URL is explicitly set.
    // Do NOT fall back to OPENAI_BASE_URL — that likely points to a proxy
    // that doesn't support embeddings.
    const baseUrl = process.env.OPENAI_EMBEDDING_BASE_URL;
    console.log(`base url = ${baseUrl}`);

    return new OpenAI({ ...(baseUrl ? { baseURL: baseUrl } : {}), apiKey });
}

export const openaiLLM: LLMProvider = {
    id: 'openai',
    name: 'OpenAI',
    models: OPENAI_MODELS,

    isConfigured(): boolean {
        return !!process.env.OPENAI_API_KEY;
    },

    async chat(params: ChatParams): Promise<ChatResponse> {
        const client = getClient();
        const response = await client.chat.completions.create({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.maxTokens ?? 1024,
            ...(params.stop ? { stop: params.stop } : {}),
        });

        const choice = response.choices[0];
        return {
            content: choice?.message?.content ?? '',
            model: response.model,
            usage: response.usage
                ? {
                    promptTokens: response.usage.prompt_tokens,
                    completionTokens: response.usage.completion_tokens,
                    totalTokens: response.usage.total_tokens,
                }
                : undefined,
            finishReason: choice?.finish_reason ?? undefined,
        };
    },

    async *chatStream(params: ChatParams): AsyncIterable<ChatChunk> {
        const client = getClient();
        const stream = await client.chat.completions.create({
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.7,
            max_tokens: params.maxTokens ?? 1024,
            stream: true,
            ...(params.stop ? { stop: params.stop } : {}),
        });

        for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            const finishReason = chunk.choices[0]?.finish_reason;
            yield {
                content: delta,
                isLast: finishReason !== null && finishReason !== undefined,
                finishReason: finishReason ?? undefined,
            };
        }
    },
};

export const openaiEmbedding: EmbeddingProvider = {
    id: 'openai',
    name: 'OpenAI Embeddings',
    defaultModel: 'text-embedding-3-small',
    dimensions: 1536,

    isConfigured(): boolean {
        return !!process.env.OPENAI_API_KEY;
    },

    async embed(texts: string[], model?: string): Promise<number[][]> {
        const client = getEmbeddingClient();
        const embeddingModel = model ?? this.defaultModel;

        // NVIDIA asymmetric models (e.g. nvidia/llama-nemotron-embed-*) require
        // an `input_type` parameter — standard OpenAI models do not support it.
        // Detection: model starts with "nvidia/" OR base URL contains "nvidia".
        const baseUrl = process.env.OPENAI_EMBEDDING_BASE_URL ?? '';
        const isNvidiaModel =
            embeddingModel.toLowerCase().startsWith('nvidia/') ||
            baseUrl.toLowerCase().includes('nvidia');

        const response = await client.embeddings.create(
            {
                model: embeddingModel,
                input: texts,
                // Spread NVIDIA-specific params inline; the SDK passes unknown
                // fields through to the request body without issues.
                ...(isNvidiaModel && {
                    input_type: process.env.NVIDIA_EMBEDDING_INPUT_TYPE ?? 'passage',
                    truncate: 'END',
                }),
            } as Parameters<typeof client.embeddings.create>[0],
        );

        return response.data.map((item) => item.embedding);
    },
};
