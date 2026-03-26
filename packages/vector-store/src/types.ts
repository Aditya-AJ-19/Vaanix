// ===========================
// Vector Store Type Definitions
// ===========================

/**
 * A document chunk with its embedding to be stored in the vector store.
 */
export interface VectorDocument {
    /** Unique identifier for the chunk */
    id: string;
    /** The text content of the chunk */
    content: string;
    /** The embedding vector */
    embedding: number[];
    /** Metadata for filtering and retrieval */
    metadata: {
        documentId: string;
        knowledgeBaseId: string;
        chunkIndex: number;
        [key: string]: unknown;
    };
}

/**
 * Query parameters for similarity search.
 */
export interface VectorQuery {
    /** The query embedding vector */
    embedding: number[];
    /** Maximum number of results to return */
    topK: number;
    /** Optional metadata filter */
    filter?: {
        knowledgeBaseId?: string;
        documentId?: string;
        [key: string]: unknown;
    };
    /** Minimum similarity score (0-1) */
    minScore?: number;
}

/**
 * A single result from a similarity search.
 */
export interface VectorResult {
    /** The chunk ID */
    id: string;
    /** The text content of the chunk */
    content: string;
    /** Similarity score (0-1, higher is more similar) */
    score: number;
    /** Associated metadata */
    metadata: Record<string, unknown>;
}

/**
 * Unified Vector Store interface.
 * Implement this to add a new vector storage backend.
 */
export interface VectorStore {
    /** Unique provider identifier */
    readonly id: string;
    /** Human-readable name */
    readonly name: string;

    /**
     * Upsert (insert or update) vector documents.
     * @param documents - The documents with embeddings to store
     */
    upsert(documents: VectorDocument[]): Promise<void>;

    /**
     * Query for similar documents.
     * @param query - The query parameters
     * @returns Matching documents ordered by similarity
     */
    query(query: VectorQuery): Promise<VectorResult[]>;

    /**
     * Delete vectors by their IDs.
     * @param ids - The IDs of the vectors to delete
     */
    delete(ids: string[]): Promise<void>;

    /**
     * Delete all vectors associated with a document.
     * @param documentId - The source document ID
     */
    deleteByDocument(documentId: string): Promise<void>;

    /**
     * Delete all vectors associated with a knowledge base.
     * @param knowledgeBaseId - The knowledge base ID
     */
    deleteByKnowledgeBase(knowledgeBaseId: string): Promise<void>;
}
