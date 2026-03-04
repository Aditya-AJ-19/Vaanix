// @vaanix/ai-providers — Plug-and-Play AI Provider Abstraction
// Swap LLM/Embedding providers via .env with zero code changes

export type {
    ChatMessage,
    ChatParams,
    ChatResponse,
    ChatChunk,
    LLMProvider,
    EmbeddingProvider,
    ProviderInfo,
} from './types';

export {
    getLLMProvider,
    getEmbeddingProvider,
    getDefaultModel,
    listLLMProviders,
    listEmbeddingProviders,
    registerLLMProvider,
    registerEmbeddingProvider,
} from './registry';

// Re-export individual providers for direct access if needed
export { openaiLLM, openaiEmbedding } from './providers/openai';
export { googleLLM } from './providers/google';
export { azureLLM, azureEmbedding } from './providers/azure';
