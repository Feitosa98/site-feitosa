'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginFinanceUser } from '@/app/actions/finance';
import { useFormStatus } from 'react-dom';

// Colors: #2C3E50, #3498DB, #7F8C8D, #BDC3C7

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            style={{
                width: '100%',
                padding: '0.85rem',
                background: pending ? '#95A5A6' : '#3498DB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.95rem',
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

    if (state?.success) {
        window.location.href = '/financeiro';
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ECF0F1',
            fontFamily: 'var(--font-geist-sans)'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem 2rem',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                width: '90%',
                maxWidth: '400px',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/logo_financeiro.png"
                        alt="Financeiro"
                        style={{ height: '80px', maxWidth: '200px', objectFit: 'contain' }}
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                parent.innerHTML = `
                                    <div style="
                                        width: 70px; 
                                        height: 70px; 
                                        background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
                                        border-radius: 16px;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        margin: 0 auto;
                                    ">
                                        <span style="color: white; font-size: 2rem; font-weight: bold;">$</span>
                                    </div>
                                `;
                            }
                        }}
                    />
                </div>

                <h1 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#2C3E50',
                    marginBottom: '0.3rem',
                    letterSpacing: '-0.3px'
                }}>
                    Bem-vindo
                </h1>
                <p style={{ color: '#7F8C8D', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Acesse sua gestão financeira pessoal
                </p>

                {searchParams.error && (
                    <div style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
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
                        background: '#FEE2E2',
                        color: '#991B1B',
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
                        <label htmlFor="email" style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#2C3E50',
                            fontWeight: '600',
                            marginBottom: '0.4rem'
                        }}>
                            E-mail
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="seu@email.com"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1.5px solid #BDC3C7',
                                borderRadius: '8px',
                                outline: 'none',
                                color: '#2C3E50',
                                fontSize: '0.95rem',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3498DB'}
                            onBlur={(e) => e.target.style.borderColor = '#BDC3C7'}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" style={{
                            display: 'block',
                            fontSize: '0.85rem',
                            color: '#2C3E50',
                            fontWeight: '600',
                            marginBottom: '0.4rem'
                        }}>
                            Senha
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1.5px solid #BDC3C7',
                                borderRadius: '8px',
                                outline: 'none',
                                color: '#2C3E50',
                                fontSize: '0.95rem',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3498DB'}
                            onBlur={(e) => e.target.style.borderColor = '#BDC3C7'}
                        />
                    </div>

                    <SubmitButton />
                </form>

                <div style={{ margin: '1.5rem 0', position: 'relative' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid #E0E0E0' }} />
                    <span style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        padding: '0 0.75rem',
                        color: '#95A5A6',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        ou continue com
                    </span>
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
                        border: '1.5px solid #BDC3C7',
                        borderRadius: '8px',
                        color: '#5F6368',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#95A5A6';
                        e.currentTarget.style.background = '#F8F9FA';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#BDC3C7';
                        e.currentTarget.style.background = '#ffffff';
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

                <div style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
                    <Link href="/" style={{
                        color: '#95A5A6',
                        textDecoration: 'none',
                        transition: 'color 0.2s'
                    }}>
                        ← Voltar para o site
                    </Link>
                </div>
            </div>
        </div>
    );
}
