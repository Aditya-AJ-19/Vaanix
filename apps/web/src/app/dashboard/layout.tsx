import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';
import Link from 'next/link';
import { SidebarNav } from '@/components/shared/sidebar-nav';

// Force dynamic rendering — Clerk components require runtime context
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex bg-surface-50">
            {/* Sidebar */}
            <aside className="w-64 bg-sidebar-bg text-sidebar-text flex flex-col border-r border-surface-800 shrink-0">
                {/* Brand */}
                <div className="px-6 py-5 border-b border-surface-800">
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">V</span>
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">Vaanix</span>
                    </Link>
                </div>

                {/* Org Switcher */}
                <div className="px-4 py-3 border-b border-surface-800">
                    <OrganizationSwitcher
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                organizationSwitcherTrigger:
                                    'w-full px-3 py-2 rounded-lg text-surface-300 hover:bg-sidebar-hover text-sm',
                            },
                        }}
                    />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    <SidebarNav />
                </nav>

                {/* User */}
                <div className="px-4 py-4 border-t border-surface-800">
                    <UserButton
                        appearance={{
                            elements: {
                                rootBox: 'w-full',
                                avatarBox: 'w-8 h-8',
                            },
                        }}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}
