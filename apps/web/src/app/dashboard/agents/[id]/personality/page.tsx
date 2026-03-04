'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAgent } from '@/hooks/use-agents';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function AgentPersonalityPage() {
    const params = useParams();
    const id = params.id as string;
    const { agent, loading, updateAgent } = useAgent(id);
    const [saving, setSaving] = useState(false);

    if (loading || !agent) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
        );
    }

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget as HTMLFormElement);
        try {
            setSaving(true);
            await updateAgent({
                systemPrompt: form.get('systemPrompt') || null,
                personality: form.get('personality') || null,
            });
            toast.success('Personality saved', {
                description: 'Your agent\'s system prompt and personality have been updated.',
            });
        } catch (err: any) {
            toast.error('Failed to save personality', {
                description: err?.message ?? 'Something went wrong. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-2xl">
            {/* System Prompt */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-1">System Prompt</h2>
                <p className="text-sm text-surface-400 mb-4">Define how your agent should behave, its role, and constraints</p>
                <textarea
                    name="systemPrompt"
                    defaultValue={agent.systemPrompt ?? ''}
                    rows={10}
                    placeholder="You are a helpful customer support agent for [Company]. You assist customers with their inquiries professionally and empathetically..."
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none font-mono text-sm leading-relaxed"
                />
            </section>

            {/* Personality */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-1">Personality &amp; Tone</h2>
                <p className="text-sm text-surface-400 mb-4">Describe the personality traits, tone, and communication style</p>
                <textarea
                    name="personality"
                    defaultValue={agent.personality ?? ''}
                    rows={5}
                    placeholder='{"tone": "friendly and professional", "style": "conversational", "traits": ["empathetic", "concise", "solution-oriented"]}'
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none font-mono text-sm"
                />
                <p className="mt-2 text-xs text-surface-400">Tip: JSON format describing tone, style, and personality traits</p>
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
