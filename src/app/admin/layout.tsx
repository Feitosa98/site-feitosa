
import Link from 'next/link';
import { signOut } from '@/auth';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{ width: '250px', background: 'var(--card-bg)', borderRight: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent)' }}>
                    {/* We might need to import Image or use regular img if this is a server component without next/image setup,
                       but layout.tsx is usually server. next/image works. We just need to check imports.
                       Actually, let's use a simple img tag for simplicity in layout if imports are missing, 
                       or safely add import. admin/layout.tsx usually has imports at top. 
                       I'll assume I can add Image, but to be safe and quick with replace, I'll use <img /> for now or check file first. 
                       Wait, I can't check file easily inside replace content thought process.
                       Let's use <img src="/assets/img/logo.png" ... /> it works universally in Next.js public folder. */}
                    <img src="/assets/img/logo.png" alt="Logo" style={{ height: '40px', width: 'auto' }} />
                    Feitosa Soluções
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Link href="/admin" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Dashboard
                    </Link>
                    <Link href="/admin/clients" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        Clientes
                    </Link>
                    <Link href="/admin/emissao" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        Emitir NFS-e
                    </Link>
                    <Link href="/admin/notas" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        Histórico
                    </Link>

                    {/* Financeiro Section */}
                    <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', paddingLeft: '0.75rem', textTransform: 'uppercase' }}>
                        Financeiro
                    </div>

                    <Link href="/admin/financeiro" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        Cobranças
                    </Link>
                    <Link href="/admin/financeiro/recibos" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                        Recibos
                    </Link>
                    <Link href="/admin/financeiro/despesas" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><line x1="18" y1="12" x2="18" y2="12.01"></line></svg>
                        Despesas
                    </Link>

                    {/* Tools Section */}
                    <div style={{ marginTop: '0.5rem', marginBottom: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', paddingLeft: '0.75rem', textTransform: 'uppercase' }}>
                        Ferramentas
                    </div>

                    <Link href="/admin/validador" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Validador
                    </Link>

                    <Link href="/admin/config" className="btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--foreground)', gap: '10px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        Configuração
                    </Link>
                </nav>

                <form action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/login' });
                }}>
                    <button type="submit" className="btn" style={{ width: '100%', border: '1px solid var(--border)', background: 'transparent', color: 'var(--secondary)' }}>
                        Sair
                    </button>
                </form>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: '2rem' }}>
                {children}
            </main>
        </div>
    )
}
