'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createMessage, getClientMessages } from '@/app/actions/messages';

export default function SupportPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<any[]>([]);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState('GENERAL');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if ((session?.user as any)?.clientId) {
            loadMessages((session.user as any).clientId);
        }
    }, [session]);

    async function loadMessages(clientId: string) {
        const data = await getClientMessages(clientId);
        setMessages(data);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!(session?.user as any)?.clientId) return;

        setLoading(true);
        const res = await createMessage((session.user as any).clientId, subject, content, type);

        if (res.success) {
            setSubject('');
            setContent('');
            setIsOpen(false);
            loadMessages((session.user as any).clientId);
        } else {
            alert('Erro ao enviar mensagem.');
        }
        setLoading(false);
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Suporte & Chamados</h1>
                <button
                    onClick={() => setIsOpen(true)}
                    className="btn btn-primary"
                >
                    + Novo Chamado
                </button>
            </div>

            {isOpen && (
                <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Tipo de Solicitação</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="input"
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="GENERAL">Dúvida Geral / Suporte</option>
                                <option value="PASSWORD_RESET">Solicitar Redefinição de Senha</option>
                                <option value="FINANCIAL">Financeiro</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Assunto</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                                className="input"
                                style={{ width: '100%', padding: '0.5rem' }}
                                placeholder="Resumo do problema"
                            />
                        </div>

                        <div className="form-group">
                            <label>Mensagem</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                className="input"
                                style={{ width: '100%', padding: '0.5rem', minHeight: '100px' }}
                                placeholder="Descreva detalhadamente sua solicitação..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="btn btn-ghost"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Enviar Solicitação'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="messages-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>Nenhuma mensagem encontrada.</div>
                ) : messages.map((msg) => (
                    <div key={msg.id} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div>
                                <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    background: msg.type === 'PASSWORD_RESET' ? '#fee2e2' : '#e0f2fe',
                                    color: msg.type === 'PASSWORD_RESET' ? '#991b1b' : '#075985',
                                    marginRight: '0.5rem'
                                }}>
                                    {msg.type === 'PASSWORD_RESET' ? 'Redefinição de Senha' : msg.type === 'FINANCIAL' ? 'Financeiro' : 'Geral'}
                                </span>
                                <strong style={{ fontSize: '1.1rem' }}>{msg.subject}</strong>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {new Date(msg.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{msg.content}</p>

                        {msg.responses && msg.responses.length > 0 && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                                <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Resposta do Suporte:</strong>
                                {msg.responses.map((resp: any) => (
                                    <div key={resp.id} style={{ marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                        {resp.content}
                                        <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                                            {new Date(resp.createdAt).toLocaleString()} por {resp.user?.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ marginTop: '1rem', fontSize: '0.8rem', textAlign: 'right' }}>
                            Status: <strong style={{ color: msg.status === 'OPEN' ? 'green' : 'gray' }}>{msg.status === 'OPEN' ? 'Aberto' : 'Fechado'}</strong>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
