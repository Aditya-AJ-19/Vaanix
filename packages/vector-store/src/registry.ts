import type { VectorStore } from './types';
import { PgVectorStore } from './pgvector';

// ===========================
// Vector Store Registry
// ===========================

// Cache: maps providerId -> VectorStore for non-db stores (Pinecone, Qdrant, etc.)
const vectorStores = new Map<string, VectorStore>();

// Cache for PgVectorStore instances keyed by the db reference.
// Using a WeakMap ensures entries are GC-able when the db object is no longer in use.
const pgVectorStoreCache = new WeakMap<object, PgVectorStore>();

/**
 * Get the active vector store.
 *
 * Resolution order:
 * 1. Explicit `overrideId` argument
 * 2. `VECTOR_STORE_PROVIDER` env variable
 * 3. Falls back to 'pgvector'
 *
 * For pgvector, the cache is keyed by the `db` reference to prevent
 * cross-context cache contamination when different database instances are used
 * (e.g. in multi-tenant scenarios).
 *
 * @param db - Database instance (Drizzle) for pgvector
 * @param overrideId - Optional provider override
 */
export function getVectorStore(db?: any, overrideId?: string | null): VectorStore {
    const providerId = overrideId ?? process.env.VECTOR_STORE_PROVIDER ?? 'pgvector';

    // For pgvector, cache per db instance to avoid cross-context contamination
    if (providerId === 'pgvector') {
        if (!db) {
            throw new Error(
                'A database instance must be provided for the pgvector store.',
            );
        }
        const cached = pgVectorStoreCache.get(db);
        if (cached) return cached;
        const store = new PgVectorStore(db);
        pgVectorStoreCache.set(db, store);
        return store;
    }

    const store = vectorStores.get(providerId);
    if (!store) {
        throw new Error(
            `Vector store "${providerId}" not found. Available: ${Array.from(vectorStores.keys()).join(', ') || 'none'}.`,
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
