'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAgent } from '@/hooks/use-agents';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { LANGUAGES, MODEL_PROVIDERS } from '@/lib/validations/agent';

export default function AgentGeneralPage() {
    const params = useParams();
    const id = params.id as string;
    const { agent, loading, updateAgent } = useAgent(id);
    const [saving, setSaving] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-surface-400 text-sm">Agent not found.</p>
            </div>
        );
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget as HTMLFormElement);
        const data: Record<string, unknown> = {
            name: form.get('name'),
            description: form.get('description') || null,
            language: form.get('language'),
            modelProvider: form.get('modelProvider') || null,
            modelId: form.get('modelId') || null,
            temperature: (() => { const v = parseFloat(form.get('temperature') as string); return Number.isFinite(v) ? v : 0.7; })(),
            maxTokens: (() => { const v = parseInt(form.get('maxTokens') as string, 10); return Number.isFinite(v) ? v : 1024; })(),
        };
        try {
            setSaving(true);
            await updateAgent(data);
            toast.success('Changes saved', {
                description: 'General settings have been updated successfully.',
            });
        } catch (err: any) {
            toast.error('Failed to save changes', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
            {/* Basic Info */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Agent Name</label>
                        <input name="name" defaultValue={agent.name} required
                            className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
                        <textarea name="description" defaultValue={agent.description ?? ''} rows={3}
                            className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Primary Language</label>
                        <select name="language" defaultValue={agent.language}
                            className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                </div>
            </section>

            {/* Model Configuration */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-1">Model Configuration</h2>
                <p className="text-sm text-surface-400 mb-4">Leave empty to use the global default from .env</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">LLM Provider</label>
                        <select name="modelProvider" defaultValue={agent.modelProvider ?? ''}
                            className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                            <option value="">Default (from .env)</option>
                            {MODEL_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Model ID</label>
                        <input name="modelId" defaultValue={agent.modelId ?? ''} placeholder="e.g., gpt-4o-mini"
                            className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Temperature ({agent.temperature ?? 0.7})</label>
                        <input name="temperature" type="range" min="0" max="2" step="0.1" defaultValue={agent.temperature ?? 0.7}
                            className="w-full accent-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-surface-700 mb-1.5">Max Tokens</label>
                        <input name="maxTokens" type="number" min={1} max={16384} defaultValue={agent.maxTokens ?? 1024}
                            className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
                    </div>
                </div>
            </section>

            {/* Save button */}
            <div className="flex justify-end">
                <button type="submit" disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
