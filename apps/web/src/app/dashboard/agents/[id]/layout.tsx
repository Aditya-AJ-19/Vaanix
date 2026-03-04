'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Rocket, TestTube2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAgent } from '@/hooks/use-agents';

export default function AgentDetailLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { agent, loading } = useAgent(id);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="text-center py-20">
                <p className="text-surface-500 text-lg">Agent not found</p>
                <button onClick={() => router.push('/dashboard/agents')}
                    className="mt-4 text-primary-600 hover:text-primary-500 font-medium">
                    ← Back to Agents
                </button>
            </div>
        );
    }

    const STATUS_COLORS: Record<string, string> = {
        draft: 'bg-amber-50 text-amber-700',
        published: 'bg-emerald-50 text-emerald-700',
        archived: 'bg-surface-100 text-surface-500',
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard/agents')}
                        className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-surface-900">{agent.name}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[agent.status] ?? ''}`}>
                                {agent.status}
                            </span>
                        </div>
                        <p className="text-sm text-surface-400 mt-0.5">v{agent.version} · Last updated {new Date(agent.updatedAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/dashboard/agents/${id}/builder`}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-surface-700 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors">
                        <TestTube2 className="w-4 h-4" /> Builder
                    </Link>
                    {agent.status === 'draft' && (
                        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all">
                            <Rocket className="w-4 h-4" /> Publish
                        </button>
                    )}
                </div>
            </div>

            {/* Tab navigation */}
            <div className="border-b border-surface-200 mb-6">
                <nav className="-mb-px flex gap-6">
                    {[
                        { label: 'General', href: `/dashboard/agents/${id}` },
                        { label: 'Personality & Prompt', href: `/dashboard/agents/${id}/personality` },
                        { label: 'Voice & Language', href: `/dashboard/agents/${id}/voice` },
                        { label: 'Messages', href: `/dashboard/agents/${id}/messages` },
                    ].map((tab) => (
                        <Link key={tab.href} href={tab.href}
                            className="py-3 px-1 text-sm font-medium border-b-2 border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 transition-colors">
                            {tab.label}
                        </Link>
                    ))}
                </nav>
            </div>

            {/* Tab content */}
            {children}
        </div>
    );
}
