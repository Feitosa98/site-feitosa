'use client';

import { useState, useEffect } from 'react';

interface Receipt {
    id: string;
    numero: number;
    value: number;
    description: string;
    paymentDate: string;
    paymentType: string;
    createdAt: string;
    client: {
        name: string;
        cpfCnpj: string;
    };
}

export default function RecibosPage() {
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [loading, setLoading] = useState(true);

    const loadReceipts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/receipts');

            // Check if response is OK before parsing JSON
            if (!res.ok) {
                console.error('API Error:', res.status, res.statusText);
                setReceipts([]);
                return;
            }

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Response is not JSON:', contentType);
                setReceipts([]);
                return;
            }

            const data = await res.json();
            setReceipts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading receipts:', error);
            setReceipts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReceipts();
    }, []);

    const total = receipts.reduce((sum, r) => sum + r.value, 0);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>Recibos Emitidos</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href="/admin/financeiro/novo-recibo" className="btn btn-primary">
                        ➕ Novo Recibo
                    </a>
                    <button onClick={loadReceipts} className="btn" disabled={loading}>
                        {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
                    </button>
                </div>
            </div>

            {/* Summary Card */}
            <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Recebido</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    R$ {total.toFixed(2).replace('.', ',')}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    {receipts.length} recibo(s) emitido(s)
                </div>
            </div>

            {/* Receipts Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Nº Recibo</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Cliente</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Data Pagamento</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Forma</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
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
                        {!loading && receipts.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    Nenhum recibo emitido ainda.
                                    <br />
                                    <small>Recibos são gerados automaticamente ao marcar cobranças como pagas.</small>
                                </td>
                            </tr>
                        )}
                        {!loading && receipts.map((receipt) => (
                            <tr key={receipt.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                    #{receipt.numero}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{receipt.client.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                        {receipt.client.cpfCnpj}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {new Date(receipt.paymentDate).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                    })}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        background: '#e0f2fe',
                                        color: '#0369a1'
                                    }}>
                                        {receipt.paymentType}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: '#10b981' }}>
                                    R$ {receipt.value.toFixed(2).replace('.', ',')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <a
                                        href={`/api/receipts/${receipt.id}/pdf`}
                                        target="_blank"
                                        className="btn btn-primary"
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            display: 'inline-block'
                                        }}
                                    >
                                        🧾 Ver PDF
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
