
import Link from 'next/link';
import { signOut } from '@/auth';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ height: '70px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    Portal do Cliente
                </div>

                <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link href="/portal" style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Minhas Notas</Link>
                    <Link href="/portal/profile" style={{ fontSize: '0.9rem', color: 'var(--foreground)' }}>Perfil</Link>

                    <form action={async () => {
                        'use server';
                        await signOut({ redirectTo: '/login' });
                    }}>
                        <button type="submit" style={{ fontSize: '0.9rem', color: 'var(--secondary)', background: 'none', border: 'none', marginLeft: '1rem' }}>
                            Sair
                        </button>
                    </form>
                </nav>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                {children}
            </main>
        </div>
    )
}
