export default function BuilderLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 bg-surface-50">
            {children}
        </div>
    );
}
