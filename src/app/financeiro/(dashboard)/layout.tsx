import { auth, signOut } from '@/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function FinanceiroLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) redirect('/login');

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>
            {/* Independent Header */}
            <header style={{
                background: '#ffffff',
                borderBottom: '1px solid #e2e8f0',
                padding: '1rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        background: '#10b981',
                        borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold'
                    }}>
                        $
                    </div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a' }}>
                        Minhas Finanças
                    </span>
                </div>

                <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
                        Voltar ao Site
                    </Link>
                    <form
                        action={async () => {
                            'use server';
                            await signOut();
                        }}
                    >
                        <button type="submit" style={{
                            background: 'none',
                            border: '1px solid #e2e8f0',
                            padding: '0.4rem 1rem',
                            borderRadius: '6px',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}>
                            Sair
                        </button>
                    </form>
                </nav>
            </header>

            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                {children}
            </main>
        </div>
    );
}
