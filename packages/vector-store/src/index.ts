// @vaanix/vector-store — Abstract Vector Storage Layer
// Swap between pgvector, Pinecone, or Qdrant via .env

export type { VectorStore, VectorDocument, VectorQuery, VectorResult } from './types';
export { getVectorStore } from './registry';
export { PgVectorStore } from './pgvector';
