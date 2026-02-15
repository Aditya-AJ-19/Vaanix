import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-950 via-primary-900 to-surface-950 flex items-center justify-center">
            <SignIn
                appearance={{
                    elements: {
                        rootBox: 'mx-auto',
                        card: 'bg-surface-900/80 backdrop-blur-xl border border-surface-700/50 shadow-2xl',
                    },
                }}
            />
        </div>
    );
}
