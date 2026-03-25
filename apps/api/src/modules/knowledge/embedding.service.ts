// ===========================
// Embedding Service
// ===========================
// Chunks document text and generates vector embeddings
// Uses @vaanix/ai-providers for embedding generation

import { knowledgeRepository } from './knowledge.repository';

// ===========================
// Text Chunking
// ===========================

export interface ChunkOptions {
    /** Target chunk size in characters (default: 1500) */
    chunkSize?: number;
    /** Overlap between chunks in characters (default: 200) */
    overlap?: number;
}

/**
 * Split text into overlapping chunks.
 *
 * Strategy: split by paragraphs first, then merge until chunk size is reached.
 * This preserves paragraph boundaries where possible.
 */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
    const { chunkSize = 1500, overlap = 200 } = options;

    // Split by double newlines (paragraphs)
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    const chunks: string[] = [];
    let current = '';

    for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();

        // If adding this paragraph exceeds chunk size, finalize current chunk
        if (current.length > 0 && current.length + trimmedParagraph.length + 2 > chunkSize) {
            chunks.push(current.trim());

            // Start new chunk with overlap from the end of current
            if (overlap > 0 && current.length > overlap) {
                // Take the last `overlap` characters, trimmed to word boundary
                const overlapText = current.slice(-overlap);
                const wordBoundary = overlapText.indexOf(' ');
                current = wordBoundary >= 0 ? overlapText.slice(wordBoundary + 1) : overlapText;
            } else {
                current = '';
            }
        }

        // If a single paragraph exceeds chunk size, split by sentences
        if (trimmedParagraph.length > chunkSize) {
            const sentences =
                trimmedParagraph.match(/[^.!?]+(?:[.!?]+|$)/g)?.map((sentence) => sentence.trim()) ??
                [trimmedParagraph];
            for (const sentence of sentences) {
                if (current.length + sentence.length + 1 > chunkSize && current.length > 0) {
                    chunks.push(current.trim());
                    current = '';
                }
                current += (current ? ' ' : '') + sentence.trim();
            }
        } else {
            current += (current ? '\n\n' : '') + trimmedParagraph;
        }
    }

    // Add remaining text
    if (current.trim().length > 0) {
        chunks.push(current.trim());
    }

    return chunks;
}

// ===========================
// Embedding Generation Pipeline
// ===========================

export interface EmbedDocumentResult {
    chunkCount: number;
    status: 'ready' | 'failed';
    errorMessage?: string;
}

/**
 * Process a document: chunk its content and generate embeddings.
 *
 * This function:
 * 1. Retrieves document content from the repository
 * 2. Splits into overlapping chunks
 * 3. Generates embeddings via @vaanix/ai-providers
 * 4. Stores chunks + embeddings via vector store
 * 5. Updates document status and chunk count
 *
 * NOTE: Embedding provider and vector store are injected as parameters
 * to keep this service testable and decoupled. The caller (controller/job)
 * is responsible for resolving the providers from the registry.
 */
export async function embedDocument(
    documentId: string,
    embeddingProvider: { embed(texts: string[], model?: string): Promise<number[][]> },
    vectorStore: { upsert(docs: Array<{ id: string; content: string; embedding: number[]; metadata: Record<string, unknown> }>): Promise<void> },
    options: ChunkOptions = {},
): Promise<EmbedDocumentResult> {
    try {
        // 1. Get the document
        const doc = await knowledgeRepository.findDocumentById(documentId);
        if (!doc) {
            return { chunkCount: 0, status: 'failed', errorMessage: 'Document not found' };
        }
        if (!doc.content) {
            return { chunkCount: 0, status: 'failed', errorMessage: 'Document has no content to embed' };
        }

        // 2. Chunk the text
        const chunks = chunkText(doc.content, options);
        if (chunks.length === 0) {
            return { chunkCount: 0, status: 'failed', errorMessage: 'No chunks generated from content' };
        }

        // 3. Generate embeddings (batch all chunks at once)
        // Use EMBEDDING_MODEL env var if set; otherwise provider uses its own defaultModel
        const embeddingModel = process.env.EMBEDDING_MODEL || undefined;
        const embeddings = await embeddingProvider.embed(chunks, embeddingModel);

        // Strict validation: embedding count must match chunk count, and every
        // embedding must be a non-empty numeric vector.  A missing or zero-length
        // vector would produce silent garbage in vector search; fail fast instead.
        if (embeddings.length !== chunks.length) {
            throw new Error(
                `Embedding count mismatch: expected ${chunks.length} but received ${embeddings.length}.`,
            );
        }
        for (let i = 0; i < embeddings.length; i++) {
            const vec = embeddings[i];
            if (!Array.isArray(vec) || vec.length === 0) {
                throw new Error(
                    `Embedding at index ${i} is empty or invalid. All chunks must produce a non-empty numeric vector.`,
                );
            }
        }

        // 4. Store chunks + embeddings
        const vectorDocs = chunks.map((content, index) => ({
            id: `${documentId}_chunk_${index}`,
            content,
            embedding: embeddings[index]!,
            metadata: {
                documentId: doc.id,
                knowledgeBaseId: doc.knowledgeBaseId,
                chunkIndex: index,
                fileName: doc.fileName,
            },
        }));

        await vectorStore.upsert(vectorDocs);

        // 5. Update document status
        await knowledgeRepository.updateDocument(documentId, {
            chunkCount: chunks.length,
            status: 'ready',
        });

        return { chunkCount: chunks.length, status: 'ready' };
    } catch (err: any) {
        // Mark document as failed
        await knowledgeRepository.updateDocument(documentId, {
            status: 'failed',
            errorMessage: err.message ?? 'Embedding generation failed',
        });

        return {
            chunkCount: 0,
            status: 'failed',
            errorMessage: err.message ?? 'Embedding generation failed',
        };
    }
}
