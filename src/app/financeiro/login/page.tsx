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
                padding: '0.9rem',
                background: pending ? '#7F8C8D' : 'linear-gradient(to right, #3498DB, #2980B9)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: pending ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                marginTop: '1.5rem',
                boxShadow: '0 4px 6px rgba(52, 152, 219, 0.2)'
            }}
        >
            {pending ? 'Acessando...' : 'Acessar Sistema'}
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
            background: 'linear-gradient(135deg, #1A252F 0%, #2C3E50 100%)',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'var(--font-geist-sans)'
        }}>
            {/* Background Abstract Shapes */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(52, 152, 219, 0.1) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(46, 204, 113, 0.05) 0%, rgba(0,0,0,0) 70%)',
                borderRadius: '50%',
                zIndex: 0
            }} />

            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                width: '90%',
                maxWidth: '420px',
                textAlign: 'center',
                zIndex: 1,
                border: '1px solid rgba(255,255,255,0.2)'
            }}>
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/logo_financeiro.png"
                        alt="Financeiro"
                        style={{ height: '100px', objectFit: 'contain' }} // Increased size
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML += `
                                <div style="padding: 20px; border: 2px solid #2C3E50; border-radius: 12px;">
                                    <h2 style="color:#2C3E50; font-weight:bold; font-size: 1.8rem; margin:0;">FINANCEIRO</h2>
                                </div>
                            `;
                        }}
                    />
                </div>

                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2C3E50', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
                    Bem-vindo
                </h1>
                <p style={{ color: '#7F8C8D', marginBottom: '2.5rem', fontSize: '1rem' }}>
                    Acesse sua gestão financeira pessoal
                </p>

                {searchParams.error && (
                    <div style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid #FECACA',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>⚠️</span> Erro de acesso. Verifique suas credenciais.
                    </div>
                )}

                {state?.error && (
                    <div style={{
                        background: '#FEE2E2',
                        color: '#991B1B',
                        padding: '1rem',
                        borderRadius: '12px',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        border: '1px solid #FECACA'
                    }}>
                        {state.error}
                    </div>
                )}

                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
                    <div>
                        <label htmlFor="email" style={{ display: 'block', fontSize: '0.85rem', color: '#34495E', fontWeight: '600', marginBottom: '0.5rem', marginLeft: '4px' }}>E-mail</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="seu@email.com"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: '#F8F9FA',
                                border: '2px solid #ECF0F1',
                                borderRadius: '12px',
                                outline: 'none',
                                color: '#2C3E50',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3498DB'}
                            onBlur={(e) => e.target.style.borderColor = '#ECF0F1'}
                        />
                    </div>

                    <div>
                        <label htmlFor="password" style={{ display: 'block', fontSize: '0.85rem', color: '#34495E', fontWeight: '600', marginBottom: '0.5rem', marginLeft: '4px' }}>Senha</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: '#F8F9FA',
                                border: '2px solid #ECF0F1',
                                borderRadius: '12px',
                                outline: 'none',
                                color: '#2C3E50',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#3498DB'}
                            onBlur={(e) => e.target.style.borderColor = '#ECF0F1'}
                        />
                    </div>

                    <SubmitButton />
                </form>

                <div style={{ margin: '2rem 0', position: 'relative' }}>
                    <hr style={{ border: 'none', borderTop: '1px solid #ECF0F1' }} />
                    <span style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'white',
                        padding: '0 1rem',
                        color: '#BDC3C7',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                    }}>OU CONTINUE COM</span>
                </div>

                <a
                    href="/api/finance/auth/google"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        width: '100%',
                        padding: '0.9rem',
                        background: '#ffffff',
                        border: '2px solid #ECF0F1',
                        borderRadius: '12px',
                        color: '#7F8C8D',
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#BDC3C7'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#ECF0F1'}
                >
                    <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.059 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.769 -21.864 51.959 -21.864 51.129 C -21.864 50.299 -21.734 49.489 -21.484 48.729 L -21.484 45.639 L -25.464 45.639 C -26.284 47.269 -26.754 49.129 -26.754 51.129 C -26.754 53.129 -26.284 54.989 -25.464 56.619 L -21.484 53.529 Z" />
                            <path fill="#EA4335" d="M -14.754 43.769 C -12.984 43.769 -11.404 44.379 -10.154 45.579 L -6.904 42.329 C -8.964 40.409 -11.664 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.769 -14.754 43.769 Z" />
                        </g>
                    </svg>
                    Google
                </a>

                <div style={{ marginTop: '2rem', fontSize: '0.85rem', opacity: 0.8 }}>
                    <Link href="/" style={{ color: '#7F8C8D', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <span>←</span> Voltar para o site
                    </Link>
                </div>
            </div>
        </div>
    );
}
