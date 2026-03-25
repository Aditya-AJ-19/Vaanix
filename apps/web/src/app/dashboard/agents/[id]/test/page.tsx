'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAgent } from '@/hooks/use-agents';
import { useChat } from '@/hooks/use-chat';
import {
    Loader2,
    Send,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    MessageSquarePlus,
    StopCircle,
    Bot,
    User,
    AlertTriangle,
    Zap,
} from 'lucide-react';

export default function AgentTestPage() {
    const params = useParams();
    const id = params.id as string;
    const { agent, loading: agentLoading } = useAgent(id);
    const {
        sessionId,
        startSession,
        endSession,
        messages,
        isStreaming,
        error,
        sendMessage,
        cancelStream,
        isListening,
        transcript,
        startListening,
        stopListening,
        ttsEnabled,
        toggleTts,
    } = useChat(id);

    const [input, setInput] = useState('');
    const [sessionLoading, setSessionLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Fill input from STT transcript
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    // Auto-focus input
    useEffect(() => {
        if (sessionId && !isStreaming) {
            inputRef.current?.focus();
        }
    }, [sessionId, isStreaming]);

    if (agentLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="text-center py-20">
                <p className="text-surface-500 text-lg">Agent not found</p>
            </div>
        );
    }

    const handleStartSession = async () => {
        try {
            setSessionLoading(true);
            await startSession();
        } catch {
            // error is set in hook
        } finally {
            setSessionLoading(false);
        }
    };

    const handleSend = () => {
        if (!input.trim() || isStreaming) return;
        sendMessage(input);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // =====================
    // No Session — Start Screen
    // =====================
    if (!sessionId) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-xl shadow-primary-500/20">
                    <Bot className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                    <h2 className="text-xl font-bold text-surface-900 mb-2">Test {agent.name}</h2>
                    <p className="text-surface-500 text-sm max-w-md">
                        Start a conversation to test how your agent responds. Messages will be processed through the configured LLM with knowledge base context.
                    </p>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    onClick={handleStartSession}
                    disabled={sessionLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all disabled:opacity-50"
                >
                    {sessionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <MessageSquarePlus className="w-4 h-4" />
                    )}
                    {sessionLoading ? 'Creating session...' : 'Start Test Session'}
                </button>
            </div>
        );
    }

    // =====================
    // Active Session — Chat UI
    // =====================
    return (
        <div className="flex flex-col h-[calc(100vh-220px)] max-w-3xl mx-auto">
            {/* Session Info Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-medium text-surface-500">Active Session</span>
                    </div>
                    <span className="text-xs text-surface-400">·</span>
                    <span className="text-xs text-surface-400">{messages.length} messages</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTts}
                        className={`p-1.5 rounded-lg transition-colors ${
                            ttsEnabled
                                ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                                : 'text-surface-400 hover:text-surface-600 hover:bg-surface-100'
                        }`}
                        title={ttsEnabled ? 'Disable voice output' : 'Enable voice output'}
                    >
                        {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={endSession}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                        <StopCircle className="w-3.5 h-3.5" />
                        End Session
                    </button>
                    <button
                        onClick={async () => {
                            await endSession();
                            handleStartSession();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-surface-700 bg-white border border-surface-200 rounded-lg hover:bg-surface-50 transition-colors"
                    >
                        <MessageSquarePlus className="w-3.5 h-3.5" />
                        New Session
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-xl mb-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 px-2 py-4 bg-white border border-surface-200 rounded-2xl mb-3">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10">
                        <Bot className="w-10 h-10 text-surface-300 mb-3" />
                        <p className="text-surface-400 text-sm">
                            {agent.greeting || 'Send a message to start the conversation'}
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex gap-3 px-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div
                            className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                msg.role === 'user'
                                    ? 'bg-primary-600 text-white rounded-br-md whitespace-pre-wrap'
                                    : 'bg-surface-100 text-surface-800 rounded-bl-md'
                            }`}
                        >
                            {msg.role === 'user' ? (
                                msg.content || (
                                    <span className="inline-flex items-center gap-1.5 text-surface-400">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Thinking...
                                    </span>
                                )
                            ) : msg.content ? (
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                        em: ({ children }) => <em className="italic">{children}</em>,
                                        code: ({ children }) => <code className="bg-surface-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                        pre: ({ children }) => <pre className="bg-surface-200 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-2">{children}</pre>,
                                        h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                                        h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5">{children}</h2>,
                                        h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                                        hr: () => <hr className="border-surface-300 my-2" />,
                                        blockquote: ({ children }) => <blockquote className="border-l-2 border-surface-400 pl-3 text-surface-600 italic mb-2">{children}</blockquote>,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-surface-400">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Thinking...
                                </span>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-xl bg-surface-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User className="w-4 h-4 text-surface-600" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex items-center gap-2 p-3 bg-white border border-surface-200 rounded-2xl">
                {/* Mic Button */}
                <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`p-2.5 rounded-xl transition-all ${
                        isListening
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                            : 'text-surface-400 hover:text-surface-600 hover:bg-surface-100'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input'}
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Text Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? 'Listening...' : 'Type a message...'}
                    disabled={isStreaming}
                    className="flex-1 px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all disabled:opacity-50"
                />

                {/* Send / Cancel */}
                {isStreaming ? (
                    <button
                        type="button"
                        onClick={cancelStream}
                        className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        title="Cancel"
                    >
                        <StopCircle className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all disabled:opacity-40 disabled:shadow-none"
                        title="Send"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
