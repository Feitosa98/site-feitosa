'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ServiceOrder {
    id: string;
    equipment: string;
    issue: string;
    status: string;
    notes: string;
    createdAt: string;
    charge?: {
        id: string;
        status: string;
        value: number;
    };
}

export default function ClientOSPage() {
    const [osList, setOSList] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/portal/os')
            .then(res => res.json())
            .then(data => {
                setOSList(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ABERTO': return '#3b82f6';
            case 'EM_ANDAMENTO': return '#f59e0b';
            case 'AGUARDANDO_PECA': return '#8b5cf6';
            case 'CONCLUIDO': return '#10b981';
            case 'CANCELADO': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'ABERTO': 'Aberto',
            'EM_ANDAMENTO': 'Em Andamento',
            'AGUARDANDO_PECA': 'Aguardando Peça',
            'CONCLUIDO': 'Concluído',
            'CANCELADO': 'Cancelado',
            'ENTREGUE': 'Entregue'
        };
        return labels[status] || status;
    };

    return (
        <div>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>Minhas Ordens de Serviço</h1>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Data</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Equipamento</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Defeito Relatado</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Cobrança</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td>
                            </tr>
                        )}
                        {!loading && osList.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Nenhuma OS encontrada.</td>
                            </tr>
                        )}
                        {!loading && osList.map(os => (
                            <tr key={os.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '500' }}>
                                    {os.equipment}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--secondary)' }}>
                                    {os.issue}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        background: `${getStatusColor(os.status)}20`, // 20% opacity using hex
                                        color: getStatusColor(os.status)
                                    }}>
                                        {getStatusLabel(os.status)}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {os.charge ? (
                                        <Link href={`/fatura/${os.charge.id}`} target="_blank" style={{ color: '#2563eb', textDecoration: 'underline', fontSize: '0.875rem' }}>
                                            Ver Fatura (R$ {os.charge.value.toFixed(2)})
                                        </Link>
                                    ) : (
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
