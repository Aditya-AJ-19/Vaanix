import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';

import './globals.css';

export const metadata: Metadata = {
    title: 'Vaanix — Voice Agent Platform',
    description: 'India-first Multilingual Voice Agent SaaS Platform for SMBs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>
                <ClerkProvider>
                    {children}
                </ClerkProvider>
            </body>
        </html>
    );
}
