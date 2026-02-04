'use client';

import { useState, useEffect } from 'react';
import { getAllMessages, respondToMessage, updateMessageStatus } from '@/app/actions/messages';
import { useSession } from 'next-auth/react';

export default function AdminMessagesPage() {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');

    useEffect(() => {
        loadMessages();
    }, []);

    async function loadMessages() {
        setLoading(true);
        const data = await getAllMessages();
        setMessages(data);
        setLoading(false);
    }

    async function handleReply(messageId: string) {
        if (!replyContent.trim() || !session?.user) return;

        // Use user ID if available, otherwise fallback (should verify user exists)
        const userId = session.user.id || 'admin'; // Access session.user.id directly after the null check

        await respondToMessage(messageId, userId, replyContent);
        setReplyContent('');
        setReplyingTo(null);
        loadMessages();
    }

    async function handleStatusChange(messageId: string, newStatus: string) {
        await updateMessageStatus(messageId, newStatus);
        loadMessages();
    }

    return (
        <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '2rem' }}>Gerenciamento de Mensagens</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {loading ? (
                    <div>Carregando...</div>
                ) : messages.length === 0 ? (
                    <div>Nenhuma mensagem encontrada.</div>
                ) : messages.map((msg) => (
                    <div key={msg.id} className="card" style={{ padding: '1.5rem', borderLeft: msg.status === 'OPEN' ? '4px solid green' : '4px solid gray' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>{msg.subject}</h3>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Cliente: <strong>{msg.client?.name}</strong> • {new Date(msg.createdAt).toLocaleString()}
                                </div>
                            </div>
                            <select
                                value={msg.status}
                                onChange={(e) => handleStatusChange(msg.id, e.target.value)}
                                style={{ padding: '4px', borderRadius: '4px' }}
                            >
                                <option value="OPEN">Aberto</option>
                                <option value="CLOSED">Fechado</option>
                                <option value="ARCHIVED">Arquivado</option>
                            </select>
                        </div>

                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                            <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                background: msg.type === 'PASSWORD_RESET' ? '#fee2e2' : '#e0f2fe',
                                color: msg.type === 'PASSWORD_RESET' ? '#991b1b' : '#075985',
                                marginRight: '0.5rem',
                                fontWeight: 'bold'
                            }}>
                                {msg.type}
                            </span>
                            {msg.content}
                        </div>

                        {/* Responses */}
                        {msg.responses.map((resp: any) => (
                            <div key={resp.id} style={{ marginLeft: '2rem', marginBottom: '0.5rem', padding: '0.5rem', borderLeft: '2px solid var(--primary)' }}>
                                <strong>{resp.user?.name}</strong>: {resp.content}
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{new Date(resp.createdAt).toLocaleString()}</div>
                            </div>
                        ))}

                        {/* Reply Box */}
                        {replyingTo === msg.id ? (
                            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Escreva sua resposta..."
                                    className="input"
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleReply(msg.id)} className="btn btn-primary btn-sm">Enviar Resposta</button>
                                    <button onClick={() => setReplyingTo(null)} className="btn btn-ghost btn-sm">Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setReplyingTo(msg.id)} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
                                Responder
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
