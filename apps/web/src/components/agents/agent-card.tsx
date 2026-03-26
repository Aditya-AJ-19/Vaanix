'use client';

import { Bot, MoreVertical, Copy, Trash2, Rocket, Archive, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { Agent } from '@/hooks/use-agents';
import { LANGUAGES } from '@/lib/validations/agent';

interface AgentCardProps {
    agent: Agent;
    onEdit: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onPublish?: (id: string) => void;
    onArchive?: (id: string) => void;
}

const DRAFT_STYLE = { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Draft' };

function getStatusStyle(status: string) {
    switch (status) {
        case 'published': return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', label: 'Published' };
        case 'archived': return { bg: 'bg-surface-100', text: 'text-surface-500', dot: 'bg-surface-400', label: 'Archived' };
        default: return DRAFT_STYLE;
    }
}

export function AgentCard({ agent, onEdit, onDuplicate, onDelete, onPublish, onArchive }: AgentCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const s = getStatusStyle(agent.status);
    const langLabel = LANGUAGES.find((l) => l.value === agent.language)?.label ?? agent.language;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            className="group bg-white rounded-2xl border border-surface-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => onEdit(agent.id)}
        >
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-surface-900 truncate">{agent.name}</h3>
                            <p className="text-xs text-surface-400 mt-0.5">v{agent.version}</p>
                        </div>
                    </div>

                    {/* Menu */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute right-0 top-8 w-44 bg-white rounded-xl border border-surface-200 shadow-xl py-1.5 z-50">
                                {agent.status === 'draft' && onPublish && (
                                    <button onClick={(e) => { e.stopPropagation(); onPublish(agent.id); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 hover:bg-primary-50 hover:text-primary-700 transition-colors">
                                        <Rocket className="w-4 h-4" /> Publish
                                    </button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); onDuplicate(agent.id); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                                    <Copy className="w-4 h-4" /> Duplicate
                                </button>
                                {agent.status !== 'archived' && onArchive && (
                                    <button onClick={(e) => { e.stopPropagation(); onArchive(agent.id); setMenuOpen(false); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50 transition-colors">
                                        <Archive className="w-4 h-4" /> Archive
                                    </button>
                                )}
                                <div className="my-1 border-t border-surface-100" />
                                <button onClick={(e) => { e.stopPropagation(); onDelete(agent.id); setMenuOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-surface-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                    {agent.description || 'No description'}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-surface-400">
                            <Globe className="w-3 h-3" />
                            {langLabel}
                        </span>
                    </div>
                    <span className="text-xs text-surface-400">
                        {new Date(agent.updatedAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
