'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import '../landing.css';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        console.log('Tentando login com:', username);

        try {
            const res = await signIn('credentials', {
                username,
                password,
                redirect: false,
            });

            console.log('Resposta do login:', res);

            if (res?.error) {
                setError('Credenciais inválidas. Verifique usuário e senha.');
                setIsLoading(false);
            } else if (res?.ok) {
                router.refresh();
                // Fetch session to check role
                const { getSession } = await import('next-auth/react');
                const session = await getSession();
                const role = (session?.user as any)?.role;

                // Force redirection after a short delay
                setTimeout(() => {
                    if (role === 'admin') {
                        window.location.href = '/admin';
                    } else if (role === 'client') {
                        window.location.href = '/portal';
                    } else {
                        // Fallback
                        window.location.href = '/';
                    }
                }, 500);
            } else {
                setError('Erro desconhecido. Tente novamente.');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Erro ao fazer login:', err);
            setError('Erro de conexão. Tente novamente.');
            setIsLoading(false);
        }
    };

    // Load icons
    useEffect(() => {
        if ((window as any).feather) (window as any).feather.replace();
    });

    return (
        <>
            <Script src="https://unpkg.com/feather-icons" onLoad={() => (window as any).feather?.replace()} />

            <div className="login-wrapper">
                {/* Tech Background */}
                <div className="tech-bg">
                    <div className="grid-overlay"></div>
                    <div className="glow-orb orb-1"></div>
                    <div className="glow-orb orb-2"></div>
                </div>

                <div className="container" style={{ maxWidth: '420px', width: '100%', position: 'relative', zIndex: 10 }}>

                    <div className="card glass float-animation" style={{
                        padding: '3rem 2.5rem',
                        width: '100%',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>

                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.95)',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    display: 'inline-flex',
                                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                                }}>
                                    {/* Using standard img to avoid Next.js Image optimization issues during dev if file is missing */}
                                    <img
                                        src="/assets/img/logo.png"
                                        alt="Logo Feitosa"
                                        style={{
                                            height: '70px',
                                            width: 'auto',
                                            display: 'block'
                                        }}
                                    />
                                </div>
                            </div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Portal Feitosa Soluções
                            </h1>
                            <p style={{ color: 'var(--text-muted)' }}>Atendimento, Chamados, Inventário e Serviços</p>
                        </div>

                        {error && (
                            <div className="error-shake" style={{
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5',
                                borderRadius: '12px',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <i data-feather="alert-triangle" style={{ width: '16px', height: '16px' }}></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                            <div className="form-group">
                                <label htmlFor="username" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Identificação</label>
                                <div className="input-group">
                                    <input
                                        id="username"
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Usuário do sistema"
                                        className="tech-input"
                                        required
                                    />
                                    <div className="input-icon">
                                        <i data-feather="user"></i>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Chave de Acesso</label>
                                <div className="input-group">
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="tech-input"
                                        required
                                    />
                                    <div className="input-icon">
                                        <i data-feather="lock"></i>
                                    </div>
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                                <Link href="/recuperar-senha" style={{ fontSize: '0.85rem', color: '#94a3b8', textDecoration: 'none', transition: 'color 0.3s' }} className="hover:text-blue-400">
                                    Esqueceu a senha?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="btn tech-btn"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Autenticando...
                                    </>
                                ) : (
                                    <>
                                        Acessar Sistema <i data-feather="chevron-right"></i>
                                    </>
                                )}
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                                <span style={{ padding: '0 1rem', color: '#64748b', fontSize: '0.9rem' }}>ou continue com</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            </div>

                            <button
                                type="button"
                                onClick={() => signIn('google')}
                                className="btn"
                                style={{
                                    width: '100%',
                                    height: '50px',
                                    background: 'white',
                                    color: '#1e293b',
                                    fontWeight: 600,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                                        fill="#FBBC05"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    />
                                </svg>
                                Entrar com Google
                            </button>
                        </form>

                        <div style={{ marginTop: '2.5rem', textAlign: 'center', position: 'relative', zIndex: 50 }}>
                            {/* Changed to standard a tag to avoid any Next.js Link / Animation z-index collision issues */}
                            <a href="/" className="back-link" style={{ cursor: 'pointer', position: 'relative' }}>
                                <i data-feather="arrow-left"></i> Voltar ao site
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .login-wrapper {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                    position: relative;
                    overflow: hidden;
                    background: #0f172a;
                }

                /* Tech Background */
                .tech-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
                    z-index: 0;
                }

                .grid-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 200%;
                    height: 200%;
                    background-image: 
                        linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
                    background-size: 50px 50px;
                    transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px);
                    animation: gridMove 20s linear infinite;
                }

                .glow-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    opacity: 0.4;
                }
                .orb-1 {
                    width: 300px;
                    height: 300px;
                    background: var(--accent-color);
                    top: 20%;
                    left: 20%;
                    animation: orbFloat 6s ease-in-out infinite;
                }
                .orb-2 {
                    width: 400px;
                    height: 400px;
                    background: #6366f1;
                    bottom: 10%;
                    right: 10%;
                    animation: orbFloat 8s ease-in-out infinite reverse;
                }

                /* Float Animation for Card */
                .float-animation {
                    animation: floatCard 6s ease-in-out infinite;
                }

                /* Inputs */
                .input-group {
                    position: relative;
                }
                .tech-input {
                    width: 100%;
                    padding: 12px 12px 12px 50px !important;
                    border-radius: 8px;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }
                .tech-input:focus {
                    background: rgba(15, 23, 42, 0.8);
                    border-color: var(--accent-color);
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                    outline: none;
                }
                .input-icon {
                    position: absolute;
                    left: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
                    display: flex;
                    transition: color 0.3s;
                }
                .tech-input:focus + .input-icon {
                    color: var(--accent-color);
                }

                /* Button */
                .tech-btn {
                    width: 100%;
                    height: 50px;
                    font-size: 1rem;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                    background: linear-gradient(135deg, var(--accent-color) 0%, #2563eb 100%);
                    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.3s;
                    margin-top: 0.5rem;
                    cursor: pointer;
                }
                .tech-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.15);
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                }
                .tech-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                /* Back Link */
                .back-link {
                    color: #94a3b8;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9rem;
                    transition: color 0.2s;
                    text-decoration: none;
                }
                .back-link:hover {
                    color: white;
                }
                .back-link i {
                    width: 16px;
                    height: 16px;
                }

                @keyframes gridMove {
                    0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); }
                    100% { transform: perspective(500px) rotateX(60deg) translateY(50px) translateZ(-200px); }
                }

                @keyframes floatCard {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }

                @keyframes orbFloat {
                    0%, 100% { transform: translate(0, 0); }
                    50% { transform: translate(30px, -30px); }
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                
                .error-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                @keyframes shake {
                    10%, 90% { transform: translate3d(-1px, 0, 0); }
                    20%, 80% { transform: translate3d(2px, 0, 0); }
                    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                    40%, 60% { transform: translate3d(4px, 0, 0); }
                }
            `}</style>
        </>
    );
}
