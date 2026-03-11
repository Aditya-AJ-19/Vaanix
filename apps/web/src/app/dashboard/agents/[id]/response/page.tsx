'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useAgent } from '@/hooks/use-agents';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { RESPONSE_STYLES, RESPONSE_FORMATS } from '@/lib/validations/agent';

export default function AgentResponsePage() {
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
        const data: Record<string, unknown> = {
            responseStyle: form.get('responseStyle') || 'conversational',
            responseFormat: form.get('responseFormat') || 'text',
            customInstructions: form.get('customInstructions') || null,
        };
        try {
            setSaving(true);
            await updateAgent(data);
            toast.success('Response settings saved', {
                description: 'Response style configuration has been updated.',
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
            {/* Response Style */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-1">Response Style</h2>
                <p className="text-sm text-surface-400 mb-5">Control how your agent communicates</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {RESPONSE_STYLES.map((style) => (
                        <label
                            key={style.value}
                            className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${(agent.responseStyle ?? 'conversational') === style.value
                                    ? 'border-primary-500 bg-primary-50/50'
                                    : 'border-surface-200 hover:border-surface-300'
                                }`}
                        >
                            <input
                                type="radio"
                                name="responseStyle"
                                value={style.value}
                                defaultChecked={(agent.responseStyle ?? 'conversational') === style.value}
                                className="sr-only"
                            />
                            <span className="text-sm font-semibold text-surface-900">{style.label}</span>
                            <span className="text-xs text-surface-500 mt-1">{style.description}</span>
                        </label>
                    ))}
                </div>
            </section>

            {/* Response Format */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-1">Response Format</h2>
                <p className="text-sm text-surface-400 mb-5">Choose how responses are structured</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {RESPONSE_FORMATS.map((fmt) => (
                        <label
                            key={fmt.value}
                            className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-sm ${(agent.responseFormat ?? 'text') === fmt.value
                                    ? 'border-primary-500 bg-primary-50/50'
                                    : 'border-surface-200 hover:border-surface-300'
                                }`}
                        >
                            <input
                                type="radio"
                                name="responseFormat"
                                value={fmt.value}
                                defaultChecked={(agent.responseFormat ?? 'text') === fmt.value}
                                className="sr-only"
                            />
                            <span className="text-sm font-semibold text-surface-900">{fmt.label}</span>
                            <span className="text-xs text-surface-500 mt-1">{fmt.description}</span>
                        </label>
                    ))}
                </div>
            </section>

            {/* Custom Instructions */}
            <section className="bg-white rounded-2xl border border-surface-200 p-6">
                <h2 className="text-lg font-semibold text-surface-900 mb-1">Custom Instructions</h2>
                <p className="text-sm text-surface-400 mb-4">
                    Additional instructions that guide your agent&apos;s response behavior
                </p>
                <textarea
                    name="customInstructions"
                    defaultValue={agent.customInstructions ?? ''}
                    rows={6}
                    placeholder="e.g., Always end responses with a question to keep the conversation going. Never share pricing unless explicitly asked."
                    className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none font-mono text-sm"
                />
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
