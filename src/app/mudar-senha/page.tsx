'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { changePassword } from '@/app/actions/user';
import { useRouter } from 'next/navigation';

export default function ChangePasswordPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage('As senhas não coincidem.');
            return;
        }

        if (password.length < 6) {
            setMessage('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        const user = session?.user as any;
        if (!user?.id) return;

        const res = await changePassword(user.id, password);

        if (res.success) {
            setMessage('Senha alterada com sucesso! Redirecionando...');
            setTimeout(() => {
                if (user.role === 'admin') router.push('/admin');
                else router.push('/portal');
            }, 1000);
        } else {
            setMessage('Erro ao alterar senha.');
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6'
        }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>Defina sua nova senha</h1>
                <p style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Por segurança, você precisa alterar sua senha provisória antes de continuar.
                </p>

                {message && (
                    <div style={{
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        borderRadius: '4px',
                        background: message.includes('sucesso') ? '#d1fae5' : '#fee2e2',
                        color: message.includes('sucesso') ? '#065f46' : '#991b1b',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="label">Nova Senha</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            className="input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {loading ? 'Alterando...' : 'Alterar Senha e Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
