// ===========================
// AI Provider Type Definitions
// ===========================

/**
 * Chat message format used across all LLM providers.
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Parameters for a chat completion request.
 */
export interface ChatParams {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    /** Optional stop sequences */
    stop?: string[];
}

/**
 * Response from a chat completion.
 */
export interface ChatResponse {
    content: string;
    model: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason?: string;
}

/**
 * A single chunk from a streaming chat completion.
 */
export interface ChatChunk {
    content: string;
    isLast: boolean;
    finishReason?: string;
}

/**
 * Unified LLM Provider interface.
 * Implement this to add a new LLM provider.
 */
export interface LLMProvider {
    /** Unique provider identifier (e.g., 'openai', 'google', 'azure') */
    readonly id: string;
    /** Human-readable provider name */
    readonly name: string;
    /** Available models for this provider */
    readonly models: string[];
    /** Perform a chat completion */
    chat(params: ChatParams): Promise<ChatResponse>;
    /** Perform a streaming chat completion */
    chatStream(params: ChatParams): AsyncIterable<ChatChunk>;
    /** Check if the provider is configured (API key present) */
    isConfigured(): boolean;
}

/**
 * Unified Embedding Provider interface.
 * Implement this to add a new embedding provider.
 */
export interface EmbeddingProvider {
    /** Unique provider identifier */
    readonly id: string;
    /** Human-readable provider name */
    readonly name: string;
    /** Default embedding model */
    readonly defaultModel: string;
    /** Output vector dimensions */
    readonly dimensions: number;
    /** Generate embeddings for a batch of texts */
    embed(texts: string[], model?: string): Promise<number[][]>;
    /** Check if the provider is configured */
    isConfigured(): boolean;
}

/**
 * Provider info returned by the registry.
 */
export interface ProviderInfo {
    id: string;
    name: string;
    models: string[];
    configured: boolean;
}
