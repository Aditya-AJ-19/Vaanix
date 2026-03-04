'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAgentSchema, type CreateAgentInput, LANGUAGES } from '@/lib/validations/agent';

interface CreateAgentDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAgentInput) => Promise<void>;
}

export function CreateAgentDialog({ open, onClose, onSubmit }: CreateAgentDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAgentInput>({
        resolver: zodResolver(createAgentSchema),
        defaultValues: { name: '', description: '', language: 'en' },
    });

    if (!open) return null;

    const handleCreateAgent = async (data: CreateAgentInput) => {
        try {
            setSubmitting(true);
            await onSubmit(data);
            reset();
            onClose();
        } catch (err) {
            // Error shown as toast by parent — do not close dialog
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl mx-4 overflow-hidden">
                {/* Header accent */}
                <div className="h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-surface-900">Create New Agent</h2>
                                <p className="text-sm text-surface-400">Set up your voice agent in seconds</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(handleCreateAgent)} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Agent Name *</label>
                            <input
                                {...register('name')}
                                type="text"
                                placeholder="e.g., Customer Support Bot"
                                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                placeholder="What does this agent do?"
                                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all resize-none"
                            />
                        </div>

                        {/* Language */}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-1.5">Primary Language</label>
                            <select
                                {...register('language')}
                                className="w-full px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>{lang.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                className="px-5 py-2.5 text-sm font-medium text-surface-600 bg-surface-100 rounded-xl hover:bg-surface-200 transition-colors">
                                Cancel
                            </button>
                            <button type="submit" disabled={submitting}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                {submitting ? 'Creating...' : 'Create Agent'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
