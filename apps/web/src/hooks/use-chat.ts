'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// ===========================
// Types
// ===========================

export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
}

interface SessionData {
    id: string;
    agentId: string;
    status: string;
    createdAt: string;
}

// ===========================
// Hook
// ===========================

export function useChat(agentId: string) {
    const { getToken } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // --- STT State ---
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    // --- TTS State ---
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

    // ===================
    // Session Management
    // ===================

    const startSession = useCallback(async () => {
        try {
            setError(null);
            const token = await getToken();
            const res = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ agentId }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error?.message || `Failed to create session: ${res.status}`);
            }

            const data = await res.json();
            const session = data.data as SessionData;
            setSessionId(session.id);
            setMessages([]);
            return session;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    }, [agentId, getToken]);

    const endSession = useCallback(async () => {
        if (!sessionId) return;
        try {
            const token = await getToken();
            const res = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/end`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error?.message || `Failed to end session: ${res.status}`);
            }
            setSessionId(null);
        } catch (err: any) {
            setError(err.message);
        }
    }, [sessionId, getToken]);

    // ===================
    // Chat Streaming
    // ===================

    const sendMessage = useCallback(async (content: string) => {
        if (!sessionId || isStreaming || !content.trim()) return;

        setError(null);
        setIsStreaming(true);

        // Add user message immediately
        const userMsg: ChatMessage = {
            role: 'user',
            content: content.trim(),
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // Add empty assistant message to fill
        const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        try {
            const token = await getToken();
            const controller = new AbortController();
            abortRef.current = controller;

            const res = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ content: content.trim() }),
                signal: controller.signal,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error?.message || `Chat failed: ${res.status}`);
            }

            // Parse SSE stream
            const reader = res.body?.getReader();
            if (!reader) throw new Error('No response stream');

            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || !trimmed.startsWith('data: ')) continue;

                    const payload = trimmed.slice(6);
                    if (payload === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(payload);
                        if (parsed.chunk) {
                            fullContent += parsed.chunk;
                            setMessages((prev) => {
                                const updated = [...prev];
                                const last = updated[updated.length - 1];
                                if (last && last.role === 'assistant') {
                                    updated[updated.length - 1] = { ...last, content: fullContent };
                                }
                                return updated;
                            });
                        }
                        if (parsed.error) {
                            setError(parsed.error);
                        }
                    } catch {
                        // skip malformed JSON
                    }
                }
            }

            // TTS: speak the full response
            if (ttsEnabled && fullContent) {
                speak(fullContent);
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message);
                // Remove the empty assistant message on error
                setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last && last.role === 'assistant' && !last.content) {
                        updated.pop();
                    }
                    return updated;
                });
            }
        } finally {
            setIsStreaming(false);
            abortRef.current = null;
        }
    }, [sessionId, isStreaming, getToken, ttsEnabled]);

    const cancelStream = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    // ===================
    // Web Speech API — STT
    // ===================

    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError('Speech recognition not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += t;
                } else {
                    interimTranscript += t;
                }
            }
            setTranscript(finalTranscript || interimTranscript);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            if (event.error !== 'aborted') {
                setError(`Speech recognition error: ${event.error}`);
            }
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setTranscript('');
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    // ===================
    // Browser TTS
    // ===================

    const speak = useCallback((text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        synthRef.current = utterance;
        window.speechSynthesis.speak(utterance);
    }, []);

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis?.cancel();
    }, []);

    const toggleTts = useCallback(() => {
        setTtsEnabled((prev) => !prev);
        if (ttsEnabled) {
            window.speechSynthesis?.cancel();
        }
    }, [ttsEnabled]);

    return {
        // Session
        sessionId,
        startSession,
        endSession,
        // Chat
        messages,
        isStreaming,
        error,
        sendMessage,
        cancelStream,
        // STT
        isListening,
        transcript,
        startListening,
        stopListening,
        // TTS
        ttsEnabled,
        toggleTts,
        speak,
        stopSpeaking,
    };
}
