'use client';

import { useState } from 'react';
import { X, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAgentSchema, type CreateAgentInput, LANGUAGES, AGENT_TEMPLATES } from '@/lib/validations/agent';

interface CreateAgentDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAgentInput) => Promise<void>;
}

export function CreateAgentDialog({ open, onClose, onSubmit }: CreateAgentDialogProps) {
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<'template' | 'form'>('template');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateAgentInput>({
        resolver: zodResolver(createAgentSchema),
        defaultValues: { name: '', description: '', language: 'en' },
    });

    if (!open) return null;

    const handleSelectTemplate = (templateId: string) => {
        const tmpl = AGENT_TEMPLATES.find((t) => t.id === templateId);
        setSelectedTemplate(templateId);

        if (tmpl) {
            setValue('name', tmpl.name);
            setValue('description', tmpl.description);
            setValue('template', tmpl.id);
        }
        setStep('form');
    };

    const handleStartBlank = () => {
        setSelectedTemplate(null);
        reset({ name: '', description: '', language: 'en' });
        setStep('form');
    };

    const handleCreateAgent = async (data: CreateAgentInput) => {
        try {
            setSubmitting(true);
            await onSubmit(data);
            reset();
            setStep('template');
            setSelectedTemplate(null);
            onClose();
        } catch (err) {
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        reset();
        setStep('template');
        setSelectedTemplate(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-surface-900/60 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl mx-4 overflow-hidden">
                {/* Header accent */}
                <div className="h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            {step === 'form' && (
                                <button onClick={() => setStep('template')}
                                    className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            )}
                            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-surface-900">
                                    {step === 'template' ? 'Choose a Template' : 'Create New Agent'}
                                </h2>
                                <p className="text-sm text-surface-400">
                                    {step === 'template' ? 'Start with a pre-built template or from scratch' : 'Configure your voice agent'}
                                </p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Template Selection Step */}
                    {step === 'template' && (
                        <div className="space-y-2">
                            {AGENT_TEMPLATES.map((tmpl) => (
                                <button
                                    key={tmpl.id}
                                    onClick={() => handleSelectTemplate(tmpl.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-sm ${selectedTemplate === tmpl.id
                                            ? 'border-primary-500 bg-primary-50/50'
                                            : 'border-surface-200 hover:border-surface-300'
                                        }`}
                                >
                                    <span className="text-2xl flex-shrink-0">{tmpl.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-surface-900 text-sm">{tmpl.name}</div>
                                        <div className="text-xs text-surface-500 mt-0.5 truncate">{tmpl.description}</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-surface-400 flex-shrink-0" />
                                </button>
                            ))}

                            <div className="pt-2">
                                <button
                                    onClick={handleStartBlank}
                                    className="w-full p-4 rounded-xl border-2 border-dashed border-surface-300 text-center text-sm font-medium text-surface-500 hover:text-surface-700 hover:border-surface-400 transition-colors"
                                >
                                    Start from Scratch
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Form Step */}
                    {step === 'form' && (
                        <form onSubmit={handleSubmit(handleCreateAgent)} className="space-y-4">
                            {selectedTemplate && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-primary-50 rounded-lg text-xs text-primary-700 font-medium">
                                    <span>{AGENT_TEMPLATES.find(t => t.id === selectedTemplate)?.icon}</span>
                                    Using template: {AGENT_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                                </div>
                            )}

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

                            {/* Hidden template field */}
                            <input type="hidden" {...register('template')} />

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={handleClose}
                                    className="px-5 py-2.5 text-sm font-medium text-surface-600 bg-surface-100 rounded-xl hover:bg-surface-200 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {submitting ? 'Creating...' : 'Create Agent'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
