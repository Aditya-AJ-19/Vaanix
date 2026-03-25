import type { LLMProvider, EmbeddingProvider, ProviderInfo } from './types';

// Import all provider implementations
import { openaiLLM, openaiEmbedding } from './providers/openai';
import { googleLLM, googleEmbedding } from './providers/google';
import { azureLLM, azureEmbedding } from './providers/azure';

// ===========================
// Provider Registries
// ===========================

const llmProviders = new Map<string, LLMProvider>();
const embeddingProviders = new Map<string, EmbeddingProvider>();

// Register built-in providers
llmProviders.set('openai', openaiLLM);
llmProviders.set('google', googleLLM);
llmProviders.set('azure', azureLLM);

embeddingProviders.set('openai', openaiEmbedding);
embeddingProviders.set('google', googleEmbedding);
embeddingProviders.set('azure', azureEmbedding);

// ===========================
// Registry API
// ===========================

/**
 * Get the active LLM provider.
 *
 * Resolution order:
 * 1. Explicit `overrideId` argument (for per-agent overrides)
 * 2. `LLM_PROVIDER` env variable
 * 3. Falls back to 'openai'
 */
export function getLLMProvider(overrideId?: string | null): LLMProvider {
    const providerId = overrideId ?? process.env.LLM_PROVIDER ?? 'openai';
    const provider = llmProviders.get(providerId);
    if (!provider) {
        throw new Error(
            `LLM provider "${providerId}" not found. Available: ${Array.from(llmProviders.keys()).join(', ')}`,
        );
    }
    return provider;
}

/**
 * Get the active embedding provider.
 *
 * Resolution order:
 * 1. Explicit `overrideId` argument
 * 2. `EMBEDDING_PROVIDER` env variable
 * 3. Falls back to 'openai'
 */
export function getEmbeddingProvider(overrideId?: string | null): EmbeddingProvider {
    const providerId = overrideId ?? process.env.EMBEDDING_PROVIDER ?? 'openai';
    const provider = embeddingProviders.get(providerId);
    if (!provider) {
        throw new Error(
            `Embedding provider "${providerId}" not found. Available: ${Array.from(embeddingProviders.keys()).join(', ')}`,
        );
    }
    return provider;
}

/**
 * Get the default model for the active LLM provider.
 *
 * Resolution order:
 * 1. Explicit overrideModel argument
 * 2. LLM_MODEL env var — only if it is valid for the selected provider
 * 3. Provider's first model
 * 4. Hard-coded fallback 'gpt-4o-mini'
 *
 * This prevents cross-provider mismatches where, for example, LLM_PROVIDER=google
 * but LLM_MODEL=gpt-4o-mini (an OpenAI model), which would fail at runtime.
 */
export function getDefaultModel(overrideModel?: string | null, overrideProvider?: string | null): string {
    if (overrideModel) return overrideModel;
    const provider = getLLMProvider(overrideProvider);
    const envModel = process.env.LLM_MODEL;
    if (envModel && provider.models.includes(envModel)) return envModel;
    return provider.models[0] ?? 'gpt-4o-mini';
}

/**
 * List all registered LLM providers with their config status.
 */
export function listLLMProviders(): ProviderInfo[] {
    return Array.from(llmProviders.entries()).map(([id, provider]) => ({
        id,
        name: provider.name,
        models: provider.models,
        configured: provider.isConfigured(),
    }));
}

/**
 * List all registered embedding providers with their config status.
 */
export function listEmbeddingProviders(): ProviderInfo[] {
    return Array.from(embeddingProviders.entries()).map(([id, provider]) => ({
        id,
        name: provider.name,
        models: [provider.defaultModel],
        configured: provider.isConfigured(),
    }));
}

/**
 * Register a custom LLM provider at runtime.
 * Enables true plug-and-play for third-party providers.
 */
export function registerLLMProvider(provider: LLMProvider): void {
    llmProviders.set(provider.id, provider);
}

/**
 * Register a custom embedding provider at runtime.
 */
export function registerEmbeddingProvider(provider: EmbeddingProvider): void {
    embeddingProviders.set(provider.id, provider);
}
