import { Bot, Plus } from 'lucide-react';

export default function AgentsPage() {
    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Agents</h1>
                    <p className="text-surface-500 mt-1">Build and manage your voice agents</p>
                </div>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 transition-all duration-300">
                    <Plus className="w-4 h-4" />
                    Create Agent
                </button>
            </div>

            {/* Empty State */}
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-surface-200 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 mb-2">No agents yet</h3>
                <p className="text-surface-500 mb-6 max-w-md mx-auto">
                    Create your first voice agent to start engaging with customers across phone, web, and WhatsApp.
                </p>
                <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-medium rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all duration-300">
                    <Plus className="w-4 h-4" />
                    Create Your First Agent
                </button>
            </div>
        </div>
    );
}
