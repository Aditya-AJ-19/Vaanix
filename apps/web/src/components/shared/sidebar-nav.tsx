'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Bot,
    BookOpen,
    BarChart3,
    Users,
    CreditCard,
    Settings,
} from 'lucide-react';

const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Agents', href: '/dashboard/agents', icon: Bot },
    { label: 'Knowledge', href: '/dashboard/knowledge', icon: BookOpen },
    { label: 'Leads', href: '/dashboard/leads', icon: Users },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function SidebarNav() {
    const pathname = usePathname();

    return (
        <ul className="space-y-1">
            {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                const Icon = item.icon;

                return (
                    <li key={item.href}>
                        <Link
                            href={item.href}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                                    ? 'bg-sidebar-active text-sidebar-text-active shadow-md shadow-primary-500/20'
                                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                                }
              `}
                        >
                            <Icon className="w-5 h-5 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
