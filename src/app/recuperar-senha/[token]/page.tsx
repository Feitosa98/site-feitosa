'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
// Styles are defined inline in this component
import { resetPassword } from '@/app/actions/auth';

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [resolvedParams, setResolvedParams] = useState<{ token: string } | null>(null);
    const router = useRouter();

    useEffect(() => {
        params.then(setResolvedParams);
    }, [params]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!resolvedParams) return;
        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('As senhas não coincidem.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const result = await resetPassword(resolvedParams.token, password);

            if (result.success) {
                setStatus('success');
                setMessage('Senha alterada com sucesso! Redirecionando...');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setStatus('error');
                setMessage(result.message || 'Erro ao redefinir senha.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Erro de conexão.');
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
                <style jsx global>{`
                    /* Inline Critical CSS reusing Login styles */
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
                    .tech-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); z-index: 0; }
                    .grid-overlay { position: absolute; top: 0; left: 0; width: 200%; height: 200%; background-image: linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px); background-size: 50px 50px; transform: perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px); animation: gridMove 20s linear infinite; }
                    .glow-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.4; }
                    .orb-1 { width: 300px; height: 300px; background: var(--accent-color, #3b82f6); top: 20%; left: 20%; animation: orbFloat 6s ease-in-out infinite; }
                    .orb-2 { width: 400px; height: 400px; background: #6366f1; bottom: 10%; right: 10%; animation: orbFloat 8s ease-in-out infinite reverse; }
                    .float-animation { animation: floatCard 6s ease-in-out infinite; }
                    
                    .tech-input { width: 100%; padding: 12px 12px 12px 50px; border-radius: 8px; background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1); color: white; font-size: 1rem; transition: all 0.3s ease; }
                    .tech-input:focus { background: rgba(15, 23, 42, 0.8); border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); outline: none; }
                    .tech-btn { width: 100%; height: 50px; font-size: 1rem; font-weight: 600; letter-spacing: 0.5px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); display: flex; justify-content: center; alignItems: center; gap: 0.5rem; transition: all 0.3s; marginTop: 0.5rem; cursor: pointer; border: none; color: white; }
                    .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748b; }
                    .tech-btn:hover { transform: translateY(-2px); }
                    @keyframes gridMove { 0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); } 100% { transform: perspective(500px) rotateX(60deg) translateY(50px) translateZ(-200px); } }
                    @keyframes floatCard { 0% { transform: translateY(0px); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0px); } }
                    @keyframes orbFloat { 0%, 100% { translate: 0 0; } 50% { translate: 30px -30px; } }
                    .spinner { width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>

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
                                    <img src="/assets/img/logo.png" alt="Logo" style={{ height: '60px', width: 'auto', display: 'block' }} />
                                </div>
                            </div>
                            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Nova Senha
                            </h1>
                            <p style={{ color: '#94a3b8' }}>Defina sua nova senha de acesso</p>
                        </div>

                        {message && (
                            <div style={{
                                padding: '1rem',
                                background: status === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                color: status === 'success' ? '#6ee7b7' : '#fca5a5',
                                borderRadius: '12px',
                                marginBottom: '1.5rem',
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <i data-feather={status === 'success' ? "check-circle" : "alert-circle"} style={{ width: '16px', height: '16px' }}></i>
                                {message}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: '#94a3b8', textTransform: 'uppercase' }}>Nova Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="tech-input"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        style={{ paddingLeft: '50px' }}
                                    />
                                    <div className="input-icon" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
                                        <i data-feather="lock"></i>
                                    </div>
                                </div>
                            </div>

                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', color: '#94a3b8', textTransform: 'uppercase' }}>Confirmar Senha</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="tech-input"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        style={{ paddingLeft: '50px' }}
                                    />
                                    <div className="input-icon" style={{ position: 'absolute', top: '50%', left: '16px', transform: 'translateY(-50%)', color: '#64748b' }}>
                                        <i data-feather="check-circle"></i>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="tech-btn" disabled={status === 'loading'}>
                                {status === 'loading' ? 'Salvando...' : 'Redefinir Senha'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
