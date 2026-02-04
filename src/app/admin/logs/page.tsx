'use client';

import { useState, useEffect } from 'react';

interface Log {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    user?: {
        name: string;
        email: string;
    };
}

export default function LogsPage() {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/logs')
            .then(res => res.json())
            .then(data => {
                setLogs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLogs([]);
                setLoading(false);
            });
    }, []);

    return (
        <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>Logs de Auditoria</h1>

            <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Data/Hora</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Usuário</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Ação</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td>
                            </tr>
                        )}
                        {!loading && logs.map(log => (
                            <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {new Date(log.createdAt).toLocaleString('pt-BR')}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {log.user?.name || 'Sistema'}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{log.user?.email}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: 'rgba(59, 130, 246, 0.1)',
                                        color: '#3b82f6',
                                        fontSize: '0.75rem',
                                        fontWeight: '500'
                                    }}>
                                        {log.action}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--secondary)' }}>
                                    {log.details}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
