import { z } from 'zod';

export const createAgentSchema = z.object({
    name: z.string().min(1, 'Agent name is required').max(255, 'Name must be under 255 characters'),
    description: z.string().max(1000).optional(),
    language: z.string().min(1),
    template: z.string().optional(),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;

export const updateAgentSchema = z.object({
    name: z.string().min(1, 'Agent name is required').max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    systemPrompt: z.string().max(10000).optional().nullable(),
    personality: z.string().max(5000).optional().nullable(),
    greeting: z.string().max(1000).optional().nullable(),
    fallbackMessage: z.string().max(1000).optional().nullable(),
    language: z.string().max(10).optional(),
    voiceId: z.string().max(255).optional().nullable(),
    modelProvider: z.string().max(50).optional().nullable(),
    modelId: z.string().max(100).optional().nullable(),
    temperature: z.coerce.number().min(0).max(2).optional(),
    maxTokens: z.coerce.number().int().min(1).max(16384).optional(),
    tags: z.string().optional().nullable(),
});

export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;

export const LANGUAGES = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi (हिंदी)' },
    { value: 'ta', label: 'Tamil (தமிழ்)' },
    { value: 'te', label: 'Telugu (తెలుగు)' },
    { value: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
    { value: 'mr', label: 'Marathi (मराठी)' },
    { value: 'bn', label: 'Bengali (বাংলা)' },
    { value: 'gu', label: 'Gujarati (ગુજરાતી)' },
    { value: 'ml', label: 'Malayalam (മലയാളം)' },
    { value: 'pa', label: 'Punjabi (ਪੰਜਾਬੀ)' },
] as const;

export const MODEL_PROVIDERS = [
    { value: 'openai', label: 'OpenAI' },
    { value: 'google', label: 'Google Gemini' },
    { value: 'azure', label: 'Azure OpenAI' },
] as const;

export const AGENT_STATUSES = ['all', 'draft', 'published', 'archived'] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];
