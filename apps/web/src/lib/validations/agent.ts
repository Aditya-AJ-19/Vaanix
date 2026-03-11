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
    responseStyle: z.string().max(50).optional().nullable(),
    responseFormat: z.string().max(50).optional().nullable(),
    customInstructions: z.string().max(5000).optional().nullable(),
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

export const RESPONSE_STYLES = [
    { value: 'concise', label: 'Concise', description: 'Short, to-the-point responses' },
    { value: 'detailed', label: 'Detailed', description: 'Thorough, comprehensive answers' },
    { value: 'conversational', label: 'Conversational', description: 'Friendly, natural dialogue' },
] as const;

export const RESPONSE_FORMATS = [
    { value: 'text', label: 'Plain Text', description: 'Free-form text responses' },
    { value: 'structured', label: 'Structured', description: 'Organized with headers and sections' },
    { value: 'bullet_points', label: 'Bullet Points', description: 'Key points as a list' },
] as const;

export const AGENT_TEMPLATES = [
    {
        id: 'customer-support',
        name: 'Customer Support',
        icon: '🎧',
        category: 'support',
        description: 'Handle customer queries, complaints, and FAQs',
        defaults: {
            systemPrompt: 'You are a helpful customer support agent. Be polite, empathetic, and solution-oriented. If you cannot resolve an issue, escalate to a human agent.',
            responseStyle: 'conversational',
            greeting: 'Hi! How can I help you today?',
            fallbackMessage: 'I\'m sorry, I didn\'t understand that. Could you rephrase your question?',
        },
    },
    {
        id: 'sales-assistant',
        name: 'Sales Assistant',
        icon: '💼',
        category: 'sales',
        description: 'Qualify leads, answer product questions, and book demos',
        defaults: {
            systemPrompt: 'You are a knowledgeable sales assistant. Understand the prospect\'s needs, highlight relevant product features, and guide them toward a purchase or demo booking.',
            responseStyle: 'conversational',
            greeting: 'Welcome! I\'d love to help you find the right solution. What are you looking for?',
            fallbackMessage: 'I want to make sure I give you the right information. Could you tell me more about what you need?',
        },
    },
    {
        id: 'appointment-booking',
        name: 'Appointment Booking',
        icon: '📅',
        category: 'booking',
        description: 'Schedule appointments, manage bookings, and send reminders',
        defaults: {
            systemPrompt: 'You are an appointment booking assistant. Help users schedule, reschedule, or cancel appointments. Confirm details like date, time, and purpose.',
            responseStyle: 'concise',
            greeting: 'Hello! Would you like to book, reschedule, or cancel an appointment?',
            fallbackMessage: 'I can help you with appointments. Would you like to book a new one?',
        },
    },
    {
        id: 'faq-bot',
        name: 'FAQ Bot',
        icon: '❓',
        category: 'general',
        description: 'Answer frequently asked questions from your knowledge base',
        defaults: {
            systemPrompt: 'You are a FAQ assistant. Answer questions based on the provided knowledge base. If you don\'t know the answer, say so honestly and suggest contacting support.',
            responseStyle: 'concise',
            greeting: 'Hi! Ask me anything — I\'ll find the answer for you.',
            fallbackMessage: 'I don\'t have an answer for that yet. Please contact our support team for help.',
        },
    },
    {
        id: 'general-assistant',
        name: 'General Assistant',
        icon: '🤖',
        category: 'general',
        description: 'A flexible assistant for any use case — start from scratch',
        defaults: {
            systemPrompt: 'You are a helpful voice assistant. Answer questions clearly and concisely.',
            responseStyle: 'conversational',
            greeting: 'Hello! How can I assist you?',
            fallbackMessage: 'I\'m not sure I understood that. Could you try again?',
        },
    },
] as const;
