'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Plus, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAgents } from '@/hooks/use-agents';
import { AgentCard } from '@/components/agents/agent-card';
import { CreateAgentDialog } from '@/components/agents/create-agent-dialog';
import { AGENT_STATUSES, type CreateAgentInput } from '@/lib/validations/agent';

const STATUS_TABS = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
] as const;

export default function AgentsPage() {
    const router = useRouter();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const { agents, loading, error, createAgent, deleteAgent, duplicateAgent, publishAgent, archiveAgent } =
        useAgents(statusFilter, searchQuery);

    const handleCreate = async (data: CreateAgentInput) => {
        try {
            const newAgent = await createAgent(data);
            toast.success('Agent created successfully', {
                description: `"${data.name}" is ready to configure.`,
            });
            if (newAgent) router.push(`/dashboard/agents/${newAgent.id}`);
        } catch (err: any) {
            toast.error('Failed to create agent', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
            throw err; // re-throw so dialog doesn't close on error
        }
    };

    const handleDelete = async (id: string) => {
        const agent = agents.find((a) => a.id === id);
        const agentName = agent?.name ?? 'this agent';
        if (!window.confirm(`Delete "${agentName}"? This action cannot be undone.`)) return;
        try {
            await deleteAgent(id);
            toast.success('Agent deleted', {
                description: `"${agentName}" has been permanently removed.`,
            });
        } catch (err: any) {
            toast.error('Failed to delete agent', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
        }
    };

    const handleDuplicate = async (id: string) => {
        const agent = agents.find((a) => a.id === id);
        try {
            await duplicateAgent(id);
            toast.success('Agent duplicated', {
                description: `A copy of "${agent?.name ?? 'the agent'}" has been created.`,
            });
        } catch (err: any) {
            toast.error('Failed to duplicate agent', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
        }
    };

    const handlePublish = async (id: string) => {
        const agent = agents.find((a) => a.id === id);
        try {
            await publishAgent(id);
            toast.success('Agent published', {
                description: `"${agent?.name ?? 'Agent'}" is now live.`,
            });
        } catch (err: any) {
            toast.error('Failed to publish agent', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
        }
    };

    const handleArchive = async (id: string) => {
        const agent = agents.find((a) => a.id === id);
        try {
            await archiveAgent(id);
            toast.success('Agent archived', {
                description: `"${agent?.name ?? 'Agent'}" has been archived.`,
            });
        } catch (err: any) {
            toast.error('Failed to archive agent', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
        }
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Agents</h1>
                    <p className="text-surface-500 mt-1">Build and manage your voice agents</p>
                </div>
                <button
                    onClick={() => setDialogOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 transition-all duration-300"
                >
                    <Plus className="w-4 h-4" />
                    Create Agent
                </button>
            </div>

            {/* Filters bar */}
            <div className="flex items-center gap-4 mb-6">
                {/* Status tabs */}
                <div className="flex bg-surface-100 rounded-xl p-1">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${statusFilter === tab.value
                                ? 'bg-white text-surface-900 shadow-sm'
                                : 'text-surface-500 hover:text-surface-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-surface-200 rounded-xl text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                    />
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-red-600 font-medium">Failed to load agents</p>
                    <p className="text-red-400 text-sm mt-1">{error}</p>
                </div>
            ) : agents.length === 0 ? (
                /* Empty state */
                <div className="bg-white rounded-2xl p-12 shadow-sm border border-surface-200 text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                        <Bot className="w-8 h-8 text-primary-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-surface-900 mb-2">
                        {statusFilter !== 'all' ? `No ${statusFilter} agents` : 'No agents yet'}
                    </h3>
                    <p className="text-surface-500 mb-6 max-w-md mx-auto">
                        {statusFilter !== 'all'
                            ? `You don't have any ${statusFilter} agents. Try a different filter.`
                            : 'Create your first voice agent to start engaging with customers across phone, web, and WhatsApp.'}
                    </p>
                    {statusFilter === 'all' && (
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300"
                        >
                            <Plus className="w-4 h-4" />
                            Create Your First Agent
                        </button>
                    )}
                </div>
            ) : (
                /* Agent grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {agents.map((agent) => (
                        <AgentCard
                            key={agent.id}
                            agent={agent}
                            onEdit={(id) => router.push(`/dashboard/agents/${id}`)}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                            onPublish={handlePublish}
                            onArchive={handleArchive}
                        />
                    ))}
                </div>
            )}

            {/* Create dialog */}
            <CreateAgentDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleCreate} />
        </div>
    );
}
