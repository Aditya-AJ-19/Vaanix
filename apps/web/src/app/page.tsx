import Link from 'next/link';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-950 via-primary-900 to-surface-950 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-primary-400/10 rounded-full blur-2xl animate-pulse delay-500" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl">
                {/* Logo / Brand */}
                <div className="inline-flex items-center gap-3 mb-8 px-5 py-2 rounded-full border border-primary-400/30 bg-primary-500/10 backdrop-blur-sm">
                    <div className="w-3 h-3 bg-accent-400 rounded-full animate-pulse" />
                    <span className="text-primary-200 text-sm font-medium tracking-wide uppercase">
                        Voice Agent Platform
                    </span>
                </div>

                <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
                    Vaan<span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">ix</span>
                </h1>

                <p className="text-xl md:text-2xl text-surface-300 mb-4 leading-relaxed">
                    India-first Multilingual Voice Agent Platform
                </p>
                <p className="text-lg text-surface-400 mb-12 max-w-2xl mx-auto">
                    Build intelligent voice agents for your business in minutes.
                    Deploy across phone, web, and WhatsApp — in Hindi, English, and regional languages.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/sign-up"
                        className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-xl shadow-primary-500/25 hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        Get Started Free
                    </Link>
                    <Link
                        href="/sign-in"
                        className="px-8 py-3.5 border border-surface-600 text-surface-300 font-medium rounded-xl hover:bg-surface-800/50 hover:border-surface-500 transition-all duration-300"
                    >
                        Sign In →
                    </Link>
                </div>

                {/* Feature pills */}
                <div className="mt-16 flex flex-wrap justify-center gap-3">
                    {['No-Code Builder', 'Hindi + English', 'Phone & Web', 'Knowledge Base', 'Lead Capture'].map(
                        (feature) => (
                            <span
                                key={feature}
                                className="px-4 py-2 rounded-full bg-surface-800/50 border border-surface-700/50 text-surface-400 text-sm backdrop-blur-sm"
                            >
                                {feature}
                            </span>
                        ),
                    )}
                </div>
            </div>
        </div>
    );
}
