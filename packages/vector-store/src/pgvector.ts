import type { VectorStore, VectorDocument, VectorQuery, VectorResult } from './types';

// ===========================
// pgvector Implementation
// ===========================
// Stores vectors as JSON arrays in a standard PostgreSQL text column.
// For production, use the pgvector extension with VECTOR type for native similarity search.
// This implementation provides a compatible API that works without the pgvector extension.

/**
 * pgvector-compatible vector store.
 *
 * MVP implementation: uses JSON-encoded vectors in a regular PostgreSQL table.
 * Similarity calculated via cosine similarity in JavaScript.
 *
 * Production upgrade path:
 * 1. Enable pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
 * 2. Change `embedding TEXT` to `embedding VECTOR(1536)`
 * 3. Use `<=>` operator for cosine distance in SQL
 */
export class PgVectorStore implements VectorStore {
    readonly id = 'pgvector';
    readonly name = 'PostgreSQL (pgvector)';

    private db: any; // Drizzle instance

    constructor(db: any) {
        this.db = db;
    }

    async upsert(documents: VectorDocument[]): Promise<void> {
        if (!this.db) throw new Error('Database not configured');

        // Use raw SQL for flexibility with the knowledge_chunks table
        for (const doc of documents) {
            await this.db.execute(
                `INSERT INTO knowledge_chunks (id, document_id, knowledge_base_id, content, embedding, chunk_index, metadata)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (id) DO UPDATE SET
                   content = EXCLUDED.content,
                   embedding = EXCLUDED.embedding,
                   metadata = EXCLUDED.metadata,
                   updated_at = NOW()`,
                [
                    doc.id,
                    doc.metadata.documentId,
                    doc.metadata.knowledgeBaseId,
                    doc.content,
                    JSON.stringify(doc.embedding),
                    doc.metadata.chunkIndex,
                    JSON.stringify(doc.metadata),
                ],
            );
        }
    }

    async query(query: VectorQuery): Promise<VectorResult[]> {
        if (!this.db) throw new Error('Database not configured');

        // Fetch candidate chunks filtered by metadata
        let sql = `SELECT id, content, embedding, metadata FROM knowledge_chunks WHERE 1=1`;
        const params: unknown[] = [];
        let paramIdx = 1;

        if (query.filter?.knowledgeBaseId) {
            sql += ` AND knowledge_base_id = $${paramIdx++}`;
            params.push(query.filter.knowledgeBaseId);
        }
        if (query.filter?.documentId) {
            sql += ` AND document_id = $${paramIdx++}`;
            params.push(query.filter.documentId);
        }

        sql += ` LIMIT 1000`; // Cap candidates for in-memory scoring

        const rows: any[] = await this.db.execute(sql, params);

        // Calculate cosine similarity in-memory (MVP approach)
        const results: VectorResult[] = rows.map((row: any) => {
            const storedEmbedding: number[] = typeof row.embedding === 'string'
                ? JSON.parse(row.embedding)
                : row.embedding;

            const score = cosineSimilarity(query.embedding, storedEmbedding);
            const metadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata ?? {});

            return {
                id: row.id,
                content: row.content,
                score,
                metadata,
            };
        });

        // Sort by similarity and apply filters
        return results
            .filter((r) => !query.minScore || r.score >= query.minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, query.topK);
    }

    async delete(ids: string[]): Promise<void> {
        if (!this.db) throw new Error('Database not configured');
        if (ids.length === 0) return;

        const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
        await this.db.execute(`DELETE FROM knowledge_chunks WHERE id IN (${placeholders})`, ids);
    }

    async deleteByDocument(documentId: string): Promise<void> {
        if (!this.db) throw new Error('Database not configured');
        await this.db.execute(`DELETE FROM knowledge_chunks WHERE document_id = $1`, [documentId]);
    }

    async deleteByKnowledgeBase(knowledgeBaseId: string): Promise<void> {
        if (!this.db) throw new Error('Database not configured');
        await this.db.execute(`DELETE FROM knowledge_chunks WHERE knowledge_base_id = $1`, [knowledgeBaseId]);
    }
}

// ===========================
// Cosine Similarity
// ===========================

function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
}
