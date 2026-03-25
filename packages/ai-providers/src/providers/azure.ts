import OpenAI from 'openai';
import type { LLMProvider, EmbeddingProvider, ChatParams, ChatResponse, ChatChunk } from '../types';

// ===========================
// Azure OpenAI Provider
// ===========================
// Uses the OpenAI SDK with Azure-specific config.
// Requires:
//   AZURE_OPENAI_API_KEY
//   AZURE_OPENAI_ENDPOINT (e.g., https://your-resource.openai.azure.com)
//   AZURE_OPENAI_API_VERSION (optional, defaults to 2024-08-01-preview)

function getClient(): OpenAI {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    if (!apiKey || !endpoint) {
        throw new Error('AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT must be set');
    }
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
    return new OpenAI({
        apiKey,
        baseURL: `${endpoint}/openai/deployments`,
        defaultQuery: { 'api-version': apiVersion },
        defaultHeaders: { 'api-key': apiKey },
    });
}

/**
 * Azure embedding calls require a different base URL than chat completions.
 * Chat: POST {endpoint}/openai/deployments/{deployment}/chat/completions
 * Embedding: POST {endpoint}/openai/deployments/{deployment}/embeddings
 *
 * The OpenAI SDK constructs the full path by appending to baseURL. For
 * embeddings the SDK appends `/embeddings`, so the baseURL must NOT end
 * with a deployment name — we just use the resource endpoint and let
 * the SDK resolve the rest.
 */
function getAzureEmbeddingClient(): OpenAI {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    if (!apiKey || !endpoint) {
        throw new Error('AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT must be set');
    }
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview';
    return new OpenAI({
        apiKey,
        // Do NOT append /openai/deployments here — the SDK will build the
        // full path as: {endpoint}/openai/deployments/{model}/embeddings
        baseURL: `${endpoint}/openai`,
        defaultQuery: { 'api-version': apiVersion },
        defaultHeaders: { 'api-key': apiKey },
    });
}

export const azureLLM: LLMProvider = {
    id: 'azure',
    name: 'Azure OpenAI',
    // Azure models are deployment names — users configure these in Azure Portal
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4', 'gpt-35-turbo'],

    isConfigured(): boolean {
        return !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
    },

    async chat(params: ChatParams): Promise<ChatResponse> {
        const client = getClient();
        const response = await client.chat.completions.create({
            model: params.model, // This is the Azure deployment name
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

export const azureEmbedding: EmbeddingProvider = {
    id: 'azure',
    name: 'Azure OpenAI Embeddings',
    defaultModel: 'text-embedding-3-small',
    dimensions: 1536,

    isConfigured(): boolean {
        return !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
    },

    async embed(texts: string[], model?: string): Promise<number[][]> {
        const client = getAzureEmbeddingClient();
        const embeddingModel = model ?? this.defaultModel;
        const response = await client.embeddings.create({
            model: embeddingModel,
            input: texts,
        });
        return response.data.map((item) => item.embedding);
    },
};
