'use client';

import { useState, useEffect } from 'react';
import { updateChargeDate, cancelCharge } from '@/app/actions/charges';

interface Charge {
    id: string;
    description: string;
    value: number;
    dueDate: string;
    status: string;
    paymentDate: string | null;
    paymentType: string | null;
    createdAt: string;
    client: {
        name: string;
        cpfCnpj: string;
    };
    service?: {
        name: string;
    };
}

export default function FinanceiroPage() {
    const [charges, setCharges] = useState<Charge[]>([]);
    const [filter, setFilter] = useState<string>('TODOS');
    const [loading, setLoading] = useState(true);
    const [totalExpenses, setTotalExpenses] = useState(0);

    const loadCharges = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/charges');

            if (!res.ok) {
                console.error('[Financeiro] API Error:', res.status, res.statusText);
                const text = await res.text();
                console.error('[Financeiro] Response body:', text.substring(0, 200));
                setCharges([]);
                return;
            }

            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('[Financeiro] Response is not JSON:', contentType);
                const text = await res.text();
                console.error('[Financeiro] Response body:', text.substring(0, 200));
                setCharges([]);
                return;
            }

            const data = await res.json();
            // Ensure data is an array
            setCharges(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[Financeiro] Error loading charges:', error);
            setCharges([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const loadExpenses = async () => {
        try {
            const res = await fetch('/api/expenses/total');
            if (res.ok) {
                const data = await res.json();
                setTotalExpenses(data.total || 0);
            }
        } catch (error) {
            console.error('[Financeiro] Error loading expenses:', error);
        }
    };

    useEffect(() => {
        loadCharges();
        loadExpenses();
    }, []);

    const handleUpdateDate = async (id: string, newDate: string) => {
        if (!newDate) return;
        try {
            await updateChargeDate(id, newDate);
            alert('Vencimento atualizado com sucesso! O PDF será regenerado.');
            loadCharges();
        } catch (error) {
            alert('Erro ao atualizar vencimento.');
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await cancelCharge(id);
            alert('Cobrança cancelada.');
            loadCharges();
        } catch (error) {
            alert('Erro ao cancelar cobrança.');
        }
    };

    const filteredCharges = charges.filter(c => {
        if (filter === 'TODOS') return true;
        return c.status === filter;
    });

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'PENDENTE': { bg: 'rgba(251, 191, 36, 0.2)', color: '#f59e0b', text: '⏳ Pendente' },
            'PAGO': { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', text: '✓ Pago' },
            'VENCIDO': { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', text: '⚠ Vencido' },
            'CANCELADO': { bg: 'rgba(156, 163, 175, 0.2)', color: '#6b7280', text: '⊘ Cancelado' }
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

    const totals = {
        pendente: charges.filter(c => c.status === 'PENDENTE').reduce((sum, c) => sum + c.value, 0),
        pago: charges.filter(c => c.status === 'PAGO').reduce((sum, c) => sum + c.value, 0),
        vencido: charges.filter(c => c.status === 'VENCIDO').reduce((sum, c) => sum + c.value, 0),
        total: charges.reduce((sum, c) => sum + c.value, 0),
        profit: charges.filter(c => c.status === 'PAGO').reduce((sum, c) => sum + c.value, 0) - totalExpenses
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>Gestão Financeira</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a href="/admin/financeiro/despesas" className="btn">
                        💸 Despesas
                    </a>
                    <a href="/admin/financeiro/nova-cobranca" className="btn btn-primary">
                        ➕ Nova Cobrança
                    </a>
                    <button onClick={() => { loadCharges(); loadExpenses(); }} className="btn" disabled={loading}>
                        {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Geral</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        R$ {totals.total.toFixed(2).replace('.', ',')}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                        {charges.length} cobrança(s)
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pendentes</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        R$ {totals.pendente.toFixed(2).replace('.', ',')}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                        {charges.filter(c => c.status === 'PENDENTE').length} cobrança(s)
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Pagos (Receita)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        R$ {totals.pago.toFixed(2).replace('.', ',')}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                        {charges.filter(c => c.status === 'PAGO').length} cobrança(s)
                    </div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Despesas</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        - R$ {totalExpenses.toFixed(2).replace('.', ',')}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                        <a href="/admin/financeiro/despesas" style={{ color: 'white', textDecoration: 'underline' }}>
                            Ver despesas →
                        </a>
                    </div>
                </div>

                <div className="card" style={{ background: totals.profit >= 0 ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', color: 'white' }}>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>💰 Lucro Líquido</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        R$ {totals.profit.toFixed(2).replace('.', ',')}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                        Receita - Despesas
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                {['TODOS', 'PENDENTE', 'PAGO', 'VENCIDO', 'CANCELADO'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className="btn"
                        style={{
                            background: filter === status ? 'var(--primary)' : 'var(--background)',
                            color: filter === status ? 'white' : 'var(--foreground)',
                            border: filter === status ? 'none' : '1px solid var(--border)'
                        }}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Charges Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Cliente</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Descrição</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Vencimento</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
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
                        {!loading && filteredCharges.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    Nenhuma cobrança encontrada.
                                </td>
                            </tr>
                        )}
                        {!loading && filteredCharges.map((charge) => (
                            <tr key={charge.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{charge.client.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                        {charge.client.cpfCnpj}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div>{charge.description}</div>
                                    {charge.service && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                                            {charge.service.name}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {new Date(charge.dueDate).toLocaleDateString('pt-BR')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                                    R$ {charge.value.toFixed(2).replace('.', ',')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    {getStatusBadge(charge.status)}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <a
                                        href={`/api/charges/${charge.id}/pdf`}
                                        target="_blank"
                                        className="btn"
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            display: 'inline-block',
                                            marginRight: '0.5rem'
                                        }}
                                    >
                                        📄 PDF
                                    </a>
                                    {charge.status === 'PENDENTE' && (
                                        <a
                                            href={`/admin/financeiro/cobranca/${charge.id}`}
                                            className="btn btn-primary"
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                display: 'inline-block'
                                            }}
                                        >
                                            💳 Pagar
                                        </a>
                                    )}
                                    {charge.status === 'VENCIDO' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    const date = prompt('Nova data de vencimento (AAAA-MM-DD):');
                                                    if (date) handleUpdateDate(charge.id, date);
                                                }}
                                                className="btn"
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.875rem',
                                                    display: 'inline-block',
                                                    marginRight: '0.5rem',
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none'
                                                }}
                                            >
                                                📅 Atualizar
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Tem certeza que deseja cancelar esta cobrança?')) {
                                                        handleCancel(charge.id);
                                                    }
                                                }}
                                                className="btn"
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.875rem',
                                                    display: 'inline-block',
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none'
                                                }}
                                            >
                                                ✕ Cancelar
                                            </button>
                                        </>
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
