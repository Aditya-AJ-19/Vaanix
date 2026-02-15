import { Bot, Users, BarChart3, PhoneCall } from 'lucide-react';

const stats = [
    { label: 'Total Agents', value: '0', icon: Bot, color: 'from-primary-500 to-primary-600' },
    { label: 'Total Leads', value: '0', icon: Users, color: 'from-accent-500 to-accent-600' },
    { label: 'Conversations', value: '0', icon: PhoneCall, color: 'from-violet-500 to-violet-600' },
    { label: 'Resolution Rate', value: '—', icon: BarChart3, color: 'from-amber-500 to-amber-600' },
];

export default function DashboardPage() {
    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-surface-900 tracking-tight">Dashboard</h1>
                <p className="text-surface-500 mt-1">Welcome to Vaanix. Build and manage your voice agents.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-surface-200 hover:shadow-md hover:border-surface-300 transition-all duration-300"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-surface-900">{stat.value}</p>
                            <p className="text-sm text-surface-500 mt-1">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-surface-200">
                <h2 className="text-lg font-semibold text-surface-900 mb-4">Quick Start</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl border border-dashed border-surface-300 hover:border-primary-400 hover:bg-primary-50/50 cursor-pointer transition-all duration-200 text-center">
                        <Bot className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                        <p className="font-medium text-surface-800">Create Agent</p>
                        <p className="text-sm text-surface-400 mt-1">Build your first voice agent</p>
                    </div>
                    <div className="p-5 rounded-xl border border-dashed border-surface-300 hover:border-accent-400 hover:bg-accent-50/50 cursor-pointer transition-all duration-200 text-center">
                        <Users className="w-8 h-8 text-accent-500 mx-auto mb-3" />
                        <p className="font-medium text-surface-800">Invite Team</p>
                        <p className="text-sm text-surface-400 mt-1">Add team members to your org</p>
                    </div>
                    <div className="p-5 rounded-xl border border-dashed border-surface-300 hover:border-violet-400 hover:bg-violet-50/50 cursor-pointer transition-all duration-200 text-center">
                        <PhoneCall className="w-8 h-8 text-violet-500 mx-auto mb-3" />
                        <p className="font-medium text-surface-800">Deploy Agent</p>
                        <p className="text-sm text-surface-400 mt-1">Launch on web, phone, or WhatsApp</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
