import type { VectorStore } from './types';
import { PgVectorStore } from './pgvector';

// ===========================
// Vector Store Registry
// ===========================

const vectorStores = new Map<string, VectorStore>();

/**
 * Get the active vector store.
 *
 * Resolution order:
 * 1. Explicit `overrideId` argument
 * 2. `VECTOR_STORE_PROVIDER` env variable
 * 3. Falls back to 'pgvector'
 *
 * @param db - Database instance (Drizzle) for pgvector
 * @param overrideId - Optional provider override
 */
export function getVectorStore(db?: any, overrideId?: string | null): VectorStore {
    const providerId = overrideId ?? process.env.VECTOR_STORE_PROVIDER ?? 'pgvector';

    // Lazily initialize pgvector if requested and not yet registered
    if (providerId === 'pgvector' && !vectorStores.has('pgvector') && db) {
        vectorStores.set('pgvector', new PgVectorStore(db));
    }

    const store = vectorStores.get(providerId);
    if (!store) {
        throw new Error(
            `Vector store "${providerId}" not found. Available: ${Array.from(vectorStores.keys()).join(', ') || 'none (provide a db instance for pgvector)'}.`,
        );
    }
    return store;
}

/**
 * Register a custom vector store at runtime.
 * Use this for Pinecone, Qdrant, or other custom implementations.
 */
export function registerVectorStore(store: VectorStore): void {
    vectorStores.set(store.id, store);
}
