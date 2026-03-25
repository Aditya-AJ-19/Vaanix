'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAgent } from '@/hooks/use-agents';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { LANGUAGES } from '@/lib/validations/agent';

export default function AgentVoicePage() {
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
        try {
            setSaving(true);
            await updateAgent({
                language: form.get('language'),
                voiceId: form.get('voiceId') || null,
            });
            toast.success('Voice settings saved', {
                description: 'Language and voice configuration have been updated.',
            });
        } catch (err: any) {
            toast.error('Failed to save voice settings', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
            {/* Language */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-1">Language</h2>
                <p className="text-sm text-surface-400 mb-4">Select the primary language for this agent</p>
                <select name="language" defaultValue={agent.language}
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all">
                    {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
            </section>

            {/* Voice */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-1">Voice</h2>
                <p className="text-sm text-surface-400 mb-4">Select a voice for your agent (TTS provider required)</p>
                <input name="voiceId" defaultValue={agent.voiceId ?? ''} placeholder="e.g., alloy, shimmer, nova"
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all" />
                <p className="mt-2 text-xs text-surface-400">Voice selection will expand when TTS providers are integrated (Phase 2)</p>
            </section>

            {/* Save */}
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
