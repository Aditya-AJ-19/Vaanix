import { sql } from 'drizzle-orm';
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

        // Use Drizzle sql tagged template for safe parameterized queries
        for (const doc of documents) {
            const embeddingJson = JSON.stringify(doc.embedding);
            const metadataJson = JSON.stringify(doc.metadata);

            await this.db.execute(
                sql`INSERT INTO knowledge_chunks (id, document_id, knowledge_base_id, content, embedding, chunk_index, metadata)
                 VALUES (${doc.id}, ${doc.metadata.documentId}, ${doc.metadata.knowledgeBaseId}, ${doc.content}, ${embeddingJson}, ${doc.metadata.chunkIndex}, ${metadataJson})
                 ON CONFLICT (id) DO UPDATE SET
                   content = EXCLUDED.content,
                   embedding = EXCLUDED.embedding,
                   metadata = EXCLUDED.metadata,
                   updated_at = NOW()`,
            );
        }
    }

    async query(query: VectorQuery): Promise<VectorResult[]> {
        if (!this.db) throw new Error('Database not configured');

        // Build the SQL dynamically using Drizzle's sql template
        // Fetch candidate chunks filtered by metadata
        const conditions: ReturnType<typeof sql>[] = [];

        if (query.filter?.knowledgeBaseId) {
            conditions.push(sql`knowledge_base_id = ${query.filter.knowledgeBaseId}`);
        }
        if (query.filter?.documentId) {
            conditions.push(sql`document_id = ${query.filter.documentId}`);
        }

        let whereClause = sql`1=1`;
        for (const cond of conditions) {
            whereClause = sql`${whereClause} AND ${cond}`;
        }

        const result = await this.db.execute(
            sql`SELECT id, content, embedding, metadata FROM knowledge_chunks WHERE ${whereClause} LIMIT 1000`,
        );

        // Drizzle Neon HTTP execute returns { rows: [...] }
        const rows: any[] = result.rows ?? result;
        console.log(`[pgvector] SQL query returned ${rows.length} row(s) for filter:`, JSON.stringify(query.filter));

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

        if (results.length > 0) {
            console.log(`[pgvector] Query embedding dims: ${query.embedding.length}, Stored embedding dims: ${(typeof rows[0].embedding === 'string' ? JSON.parse(rows[0].embedding) : rows[0].embedding)?.length}`);
            const topScores = results.map(r => r.score).sort((a, b) => b - a).slice(0, 5);
            console.log(`[pgvector] Top similarity scores (before minScore filter): ${topScores.join(', ')}`);
            console.log(`[pgvector] minScore filter: ${query.minScore}`);
        }

        // Sort by similarity and apply filters
        return results
            .filter((r) => !query.minScore || r.score >= query.minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, query.topK);
    }

    async delete(ids: string[]): Promise<void> {
        if (!this.db) throw new Error('Database not configured');
        if (ids.length === 0) return;

        // Build IN clause using Drizzle sql template
        const idList = sql.join(ids.map((id) => sql`${id}`), sql`, `);
        await this.db.execute(sql`DELETE FROM knowledge_chunks WHERE id IN (${idList})`);
    }

    async deleteByDocument(documentId: string): Promise<void> {
        if (!this.db) throw new Error('Database not configured');
        await this.db.execute(sql`DELETE FROM knowledge_chunks WHERE document_id = ${documentId}`);
    }

    async deleteByKnowledgeBase(knowledgeBaseId: string): Promise<void> {
        if (!this.db) throw new Error('Database not configured');
        await this.db.execute(sql`DELETE FROM knowledge_chunks WHERE knowledge_base_id = ${knowledgeBaseId}`);
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
