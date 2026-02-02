'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import '../landing.css';
import { requestPasswordReset } from '@/app/actions/auth';

export default function RecoverPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        try {
            // Call server action
            const result = await requestPasswordReset(email);

            if (result.success) {
                setStatus('success');
                setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
            } else {
                setStatus('error');
                setMessage(result.message || 'Ocorreu um erro. Tente novamente.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Erro de conexão. Verifique sua internet.');
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
                                    {/* Using standard img for reliability */}
                                    <img
                                        src="/assets/img/logo.png"
                                        alt="Logo Feitosa"
                                        style={{ height: '60px', width: 'auto', display: 'block' }}
                                    />
                                </div>
                            </div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Recuperar Senha
                            </h1>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Informe seu e-mail para receber o link</p>
                        </div>

                        {message && (
                            <div className="error-shake" style={{
                                padding: '1rem',
                                background: status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: status === 'success' ? '#6ee7b7' : '#fca5a5',
                                borderRadius: '12px',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <i data-feather={status === 'success' ? "check-circle" : "alert-circle"} style={{ width: '16px', height: '16px' }}></i>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label htmlFor="email" style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>E-mail Cadastrado</label>
                                <div className="input-group">
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="tech-input"
                                        required
                                        style={{ paddingLeft: '50px' }} // Inline style to ensure padding
                                    />
                                    <div className="input-icon">
                                        <i data-feather="mail"></i>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn tech-btn"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    <>
                                        <span className="spinner"></span>
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        Enviar Link <i data-feather="send"></i>
                                    </>
                                )}
                            </button>
                        </form>

                        <div style={{ marginTop: '2.5rem', textAlign: 'center', position: 'relative', zIndex: 50 }}>
                            <Link href="/login" className="back-link">
                                <i data-feather="arrow-left"></i> Voltar ao login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                /* Reusing styles from login page - ensuring global/page specific css availability */
                /* Assuming landing.css and the styles injected in login page cover mainly common classes, 
                   but we need the specific tech-bg and float animation again here if they were scoped.
                   For safety, re-including the critical CSS for this page's layout. */
                
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
                .orb-1 { width: 300px; height: 300px; background: var(--accent-color); top: 20%; left: 20%; animation: orbFloat 6s ease-in-out infinite; }
                .orb-2 { width: 400px; height: 400px; background: #6366f1; bottom: 10%; right: 10%; animation: orbFloat 8s ease-in-out infinite reverse; }
                .float-animation { animation: floatCard 6s ease-in-out infinite; }
                
                .input-group { position: relative; }
                .tech-input {
                    width: 100%;
                    padding: 12px 12px 12px 50px;
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
                .tech-input:focus + .input-icon { color: var(--accent-color); }

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
                    border: none;
                    color: white;
                }
                .tech-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3), 0 4px 6px -2px rgba(37, 99, 235, 0.15);
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                }
                .tech-btn:disabled { opacity: 0.7; cursor: not-allowed; }

                .back-link {
                    color: #94a3b8;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.9rem;
                    transition: color 0.2s;
                    text-decoration: none;
                }
                .back-link:hover { color: white; }
                
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
            `}</style>
        </>
    );
}
