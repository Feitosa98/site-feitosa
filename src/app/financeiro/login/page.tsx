'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginFinanceUser } from '@/app/actions/finance';
import { useFormStatus } from 'react-dom';

// Colors:
// Dark Blue (Text/Header): #2C3E50
// Blue (Primary/Button): #3498DB
// Gray Blue (Secondary): #7F8C8D
// Light Gray (Border): #BDC3C7

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            style={{
                width: '100%',
                padding: '0.75rem',
                background: pending ? '#7F8C8D' : '#3498DB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: pending ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
                marginTop: '1rem'
            }}
        >
            {pending ? 'Entrando...' : 'Entrar'}
        </button>
    );
}

export default function FinanceLoginPage({
    searchParams,
}: {
    searchParams: { error?: string };
}) {
    const [state, formAction] = useActionState(loginFinanceUser, null);

    // If success, we should redirect. 
    // Usually Server Action handles redirect, but if we want to handle it here:
    if (state?.success) {
        window.location.href = '/financeiro'; // Force hard navigation to refresh session
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F0F2F5', // Light gray background
            fontFamily: 'var(--font-geist-sans)'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '400px',
                textAlign: 'center',
                border: '1px solid #BDC3C7'
            }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/logo_financeiro.png"
                        alt="Financeiro"
                        style={{ height: '50px', margin: '0 auto' }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML += `<h2 style="color:#2C3E50; font-weight:bold;">FINANCEIRO</h2>`;
                        }}
                    />
                </div>

                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2C3E50', marginBottom: '0.25rem' }}>
                    Bem-vindo
                </h1>
                <p style={{ color: '#7F8C8D', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Gestão Financeira Pessoal
                </p>

                {searchParams.error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.85rem'
                    }}>
                        Erro de acesso. Verifique suas credenciais.
                    </div>
                )}

                {state?.error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        fontSize: '0.85rem'
                    }}>
                        {state.error}
                    </div>
                )}

                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', color: '#2C3E50', fontWeight: '600', marginBottom: '0.3rem' }}>E-mail</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="seu@email.com"
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.8rem',
                                border: '1px solid #BDC3C7',
                                borderRadius: '6px',
                                outline: 'none',
                                color: '#2C3E50'
                            }}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', color: '#2C3E50', fontWeight: '600', marginBottom: '0.3rem' }}>Senha</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '0.6rem 0.8rem',
                                border: '1px solid #BDC3C7',
                                borderRadius: '6px',
                                outline: 'none',
                                color: '#2C3E50'
                            }}
                        />
                    </div>

                    <SubmitButton />
                </form>

                <div style={{ margin: '1.5rem 0', position: 'relative' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid #BDC3C7' }} />
                    <span style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        padding: '0 0.5rem',
                        color: '#BDC3C7',
                        fontSize: '0.8rem'
                    }}>ou</span>
                </div>

                <a
                    href="/api/finance/auth/google"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.75rem',
                        background: '#ffffff',
                        border: '1px solid #BDC3C7',
                        borderRadius: '8px',
                        color: '#7F8C8D',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                    }}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.059 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.769 -21.864 51.959 -21.864 51.129 C -21.864 50.299 -21.734 49.489 -21.484 48.729 L -21.484 45.639 L -25.464 45.639 C -26.284 47.269 -26.754 49.129 -26.754 51.129 C -26.754 53.129 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z" />
                            <path fill="#EA4335" d="M -14.754 43.769 C -12.984 43.769 -11.404 44.379 -10.154 45.579 L -6.904 42.329 C -8.964 40.409 -11.664 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.769 -14.754 43.769 Z" />
                        </g>
                    </svg>
                    Google
                </a>

                <div style={{ marginTop: '2rem', fontSize: '0.85rem' }}>
                    <Link href="/" style={{ color: '#BDC3C7', textDecoration: 'none' }}>
                        ← Voltar para o site
                    </Link>
                </div>
            </div>
        </div>
    );
}
