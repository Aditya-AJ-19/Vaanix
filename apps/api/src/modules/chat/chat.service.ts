import { agentRepository } from '../agents/agent.repository';
import { knowledgeRepository } from '../knowledge/knowledge.repository';
import { chatRepository } from './chat.repository';
import { getLLMProvider, getEmbeddingProvider, getDefaultModel } from '@vaanix/ai-providers';
import { getVectorStore } from '@vaanix/vector-store';
import { db } from '../../core/db';
import type { ChatMessage } from '@vaanix/ai-providers';

// ===========================
// Types
// ===========================

export interface ChatStreamResult {
    stream: AsyncIterable<string>;
    conversationId: string;
}

// ===========================
// Service
// ===========================

export const chatService = {
    /**
     * Create a new chat session for an agent.
     */
    async createSession(agentId: string, orgId: string, userId: string) {
        // Verify agent exists and belongs to org
        const agent = await agentRepository.findById(agentId, orgId);
        if (!agent) {
            throw Object.assign(new Error('Agent not found'), { statusCode: 404 });
        }

        const conversation = await chatRepository.createConversation({
            organizationId: orgId,
            agentId,
            userId,
            channel: 'browser_test',
        });

        return conversation;
    },

    /**
     * Get a session with its messages.
     */
    async getSession(sessionId: string, orgId: string) {
        const conversation = await chatRepository.getConversation(sessionId, orgId);
        if (!conversation) {
            throw Object.assign(new Error('Session not found'), { statusCode: 404 });
        }

        const messages = await chatRepository.getMessages(sessionId);
        return { ...conversation, messages };
    },

    /**
     * List sessions for an agent.
     */
    async listSessions(agentId: string, orgId: string, page = 1, pageSize = 20) {
        return chatRepository.listConversations(agentId, orgId, page, pageSize);
    },

    /**
     * End a chat session.
     */
    async endSession(sessionId: string, orgId: string) {
        const conversation = await chatRepository.getConversation(sessionId, orgId);
        if (!conversation) {
            throw Object.assign(new Error('Session not found'), { statusCode: 404 });
        }
        return chatRepository.endConversation(sessionId, orgId);
    },

    /**
     * Stream a chat response. This is the core orchestration method:
     * 1. Fetch agent config
     * 2. Retrieve KB context via vector search
     * 3. Build message history
     * 4. Stream LLM response
     * 5. Persist messages
     */
    async *streamChat(
        sessionId: string,
        userMessage: string,
        orgId: string,
    ): AsyncGenerator<string> {
        const startTime = Date.now();

        // 1. Get conversation and agent
        const conversation = await chatRepository.getConversation(sessionId, orgId);
        if (!conversation) {
            throw Object.assign(new Error('Session not found'), { statusCode: 404 });
        }
        if (conversation.status === 'ended') {
            throw Object.assign(new Error('Session has ended'), { statusCode: 400 });
        }

        const agent = await agentRepository.findById(conversation.agentId, orgId);
        if (!agent) {
            throw Object.assign(new Error('Agent not found'), { statusCode: 404 });
        }

        // 2. Save user message
        await chatRepository.addMessage({
            conversationId: sessionId,
            role: 'user',
            content: userMessage,
        });

        // 3. Retrieve knowledge context
        let contextText = '';
        try {
            const linkedKbs = await knowledgeRepository.findKbsByAgentId(agent.id);
            console.log(`[chat] Agent ${agent.id} has ${linkedKbs.length} linked knowledge base(s)`);
            if (linkedKbs.length > 0) {
                const embeddingProvider = getEmbeddingProvider();
                if (embeddingProvider && embeddingProvider.isConfigured()) {
                    console.log(`[chat] Embedding provider "${embeddingProvider.id}" is configured, generating embedding...`);
                    // IMPORTANT: Use the same embedding model that was used to embed the documents.
                    // If EMBEDDING_MODEL is set (e.g. nvidia/llama-nemotron-embed-1b-v2), using
                    // a different model for query vs documents would produce incompatible vectors.
                    const embeddingModel = process.env.EMBEDDING_MODEL || undefined;

                    // For NVIDIA asymmetric models, temporarily override the input_type to 'query'
                    // (documents are embedded with 'passage', queries must use 'query')
                    const origInputType = process.env.NVIDIA_EMBEDDING_INPUT_TYPE;
                    const isNvidiaModel = embeddingModel?.toLowerCase().startsWith('nvidia/') ||
                        (process.env.OPENAI_EMBEDDING_BASE_URL ?? '').toLowerCase().includes('nvidia');
                    if (isNvidiaModel) {
                        process.env.NVIDIA_EMBEDDING_INPUT_TYPE = 'query';
                    }

                    const embeddings = await embeddingProvider.embed([userMessage], embeddingModel);

                    // Restore original input_type
                    if (isNvidiaModel) {
                        if (origInputType !== undefined) {
                            process.env.NVIDIA_EMBEDDING_INPUT_TYPE = origInputType;
                        } else {
                            delete process.env.NVIDIA_EMBEDDING_INPUT_TYPE;
                        }
                    }
                    const queryEmbedding = embeddings[0];
                    if (!queryEmbedding) throw new Error('Embedding generation failed');
                    const vectorStore = getVectorStore(db);

                    // Query across all linked KBs
                    const kbIds = linkedKbs.map((kb: { id: string }) => kb.id);
                    console.log(`[chat] Querying vector store across KB IDs: ${kbIds.join(', ')}`);
                    const allResults = await Promise.all(
                        kbIds.map((kbId: string) =>
                            vectorStore.query({
                                embedding: queryEmbedding,
                                topK: 5,
                                filter: { knowledgeBaseId: kbId },
                                minScore: 0.25, // Lowered from 0.5 to accommodate NVIDIA embedding distributions
                            })
                        )
                    );
                    const results = allResults.flat().sort((a, b) => b.score - a.score).slice(0, 5);
                    console.log(`[chat] Vector search returned ${results.length} result(s)`);

                    if (results.length > 0) {
                        const chunks = results
                            .map((r) => r.content || '')
                            .filter(Boolean);
                        if (chunks.length > 0) {
                            contextText = '\n\n--- Knowledge Base Context ---\n' +
                                chunks.join('\n---\n') +
                                '\n--- End Context ---\n';
                            console.log(`[chat] Injected ${chunks.length} KB context chunk(s) into system prompt`);
                        }
                    } else {
                        console.log('[chat] No matching KB chunks found for query');
                    }
                } else {
                    console.warn('[chat] Embedding provider is NOT configured — skipping KB retrieval');
                }
            }
        } catch (err) {
            // Knowledge retrieval is best-effort — don't fail the chat
            console.error('[chat] Knowledge retrieval failed:', err);
        }

        // 4. Build message array
        const systemPromptText = (agent.systemPrompt || 'You are a helpful assistant.') + contextText;

        const history = await chatRepository.getMessages(sessionId);
        const messages: ChatMessage[] = [
            { role: 'system', content: systemPromptText },
            // Include recent history (exclude the user message we just saved — it's the last one)
            ...history.slice(0, -1).map((m: { role: string; content: string }) => ({
                role: m.role as 'user' | 'assistant' | 'system',
                content: m.content,
            })),
            { role: 'user', content: userMessage },
        ];

        // 5. Stream LLM response
        const provider = getLLMProvider(agent.modelProvider ?? undefined);
        if (!provider || !provider.isConfigured()) {
            throw Object.assign(
                new Error('LLM provider not configured. Set the API key in your environment.'),
                { statusCode: 503 },
            );
        }

        const model = agent.modelId || getDefaultModel(provider.id) || provider.models[0];
        let fullResponse = '';
        let totalTokens = 0;

        const stream = provider.chatStream({
            model,
            messages,
            temperature: agent.temperature ?? 0.7,
            maxTokens: agent.maxTokens ?? 1024,
        });

        for await (const chunk of stream) {
            fullResponse += chunk.content;
            yield chunk.content;

            if (chunk.isLast) {
                break;
            }
        }

        // 6. Save assistant response
        const latencyMs = Date.now() - startTime;
        // Rough token estimation (1 token ≈ 4 chars)
        totalTokens = Math.ceil(fullResponse.length / 4);

        await chatRepository.addMessage({
            conversationId: sessionId,
            role: 'assistant',
            content: fullResponse,
            tokenCount: totalTokens,
            latencyMs,
        });
    },
};
