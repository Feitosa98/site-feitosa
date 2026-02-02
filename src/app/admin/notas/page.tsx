
'use client';

import { getNotes } from '@/app/actions/notes';
import { useEffect, useState } from 'react';

export default function NotasPage() {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadNotes = async () => {
        setLoading(true);
        const data = await getNotes();
        setNotes(data);
        setLoading(false);
    };

    useEffect(() => {
        loadNotes();
    }, []);

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'AUTORIZADA': { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', text: '✓ Autorizada' },
            'PENDENTE': { bg: 'rgba(251, 191, 36, 0.2)', color: '#f59e0b', text: '⏳ Pendente' },
            'REJEITADA': { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', text: '✗ Rejeitada' },
            'CANCELADA': { bg: 'rgba(156, 163, 175, 0.2)', color: '#6b7280', text: '⊘ Cancelada' }
        };

        const style = styles[status] || styles['PENDENTE'];
        return (
            <span style={{
                fontSize: '0.75rem',
                background: style.bg,
                color: style.color,
                padding: '4px 10px',
                borderRadius: '1rem',
                fontWeight: '500'
            }}>
                {style.text}
            </span>
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>Histórico de Notas Fiscais</h1>
                <button onClick={loadNotes} className="btn" disabled={loading}>
                    {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Número</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Tomador</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Data Emissão</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Valor (R$)</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    Carregando...
                                </td>
                            </tr>
                        )}
                        {!loading && notes.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    Nenhuma nota emitida ainda.
                                    <br />
                                    <a href="/admin/emissao" style={{ color: 'var(--primary)', marginTop: '0.5rem', display: 'inline-block' }}>
                                        Emitir primeira nota →
                                    </a>
                                </td>
                            </tr>
                        )}
                        {!loading && notes.map((note) => (
                            <tr key={note.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                    #{note.numero}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div>{note.clientName}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                        {note.clientCpfCnpj}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {new Date(note.emissionDate).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                                    {note.value?.toLocaleString('pt-BR', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    })}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {getStatusBadge(note.status)}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <a
                                        href={`/api/notas/${note.id}/pdf`}
                                        target="_blank"
                                        className="btn"
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            display: 'inline-block'
                                        }}
                                    >
                                        📄 PDF
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
