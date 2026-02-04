'use client';

import { useState, useEffect } from 'react';
import { updateChargeDate, cancelCharge, markAsPaid } from '@/app/actions/charges';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import RevenueChart from '@/components/charts/RevenueChart';
import ServicePieChart from '@/components/charts/ServicePieChart';

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
        phone?: string | null;
        email?: string | null;
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

    // UI States
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [updateDateModal, setUpdateDateModal] = useState<{ isOpen: boolean; chargeId: string | null }>({ isOpen: false, chargeId: null });
    const [newDate, setNewDate] = useState('');
    const [chartData, setChartData] = useState<{ revenue: any[], pie: any[] }>({ revenue: [], pie: [] });

    const loadChartData = async () => {
        try {
            const res = await fetch('/api/finance/charts');
            if (res.ok) {
                const data = await res.json();
                setChartData({
                    revenue: data.chartData || [],
                    pie: data.pieData || []
                });
            }
        } catch (error) {
            console.error('Error loading chart data:', error);
        }
    };

    const loadCharges = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/charges?t=${new Date().getTime()}`);

            if (!res.ok) {
                console.error('[Financeiro] API Error:', res.status);
                setCharges([]);
                return;
            }

            const data = await res.json();
            setCharges(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('[Financeiro] Error loading charges:', error);
            setCharges([]);
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
        loadChartData();
    }, []);

    const handleUpdateDate = async () => {
        if (!newDate || !updateDateModal.chargeId) return;

        try {
            await updateChargeDate(updateDateModal.chargeId, newDate);
            setUpdateDateModal({ isOpen: false, chargeId: null });
            setNewDate('');
            setToast({ message: 'Vencimento atualizado com sucesso! O PDF será regenerado.', type: 'success' });
            loadCharges();
        } catch (error) {
            setToast({ message: 'Erro ao atualizar vencimento.', type: 'error' });
        }
    };

    const handleCancel = async (id: string) => {
        try {
            await cancelCharge(id);
            setToast({ message: 'Cobrança cancelada.', type: 'info' });
            loadCharges();
        } catch (error) {
            setToast({ message: 'Erro ao cancelar cobrança.', type: 'error' });
        }
    };

    const handleMarkAsPaid = async (id: string) => {
        try {
            await markAsPaid(id);
            setToast({ message: 'Pagamento confirmado e recibo enviado!', type: 'success' });
            loadCharges();
        } catch (error) {
            setToast({ message: 'Erro ao confirmar pagamento.', type: 'error' });
        }
    };

    // ... rest of existing filter and rendering logic ...

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

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>Fluxo de Caixa (Últimos 6 Meses)</h2>
                    {chartData.revenue.length > 0 ? (
                        <RevenueChart data={chartData.revenue} />
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                            Carregando...
                        </div>
                    )}
                </div>
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: '600' }}>Receita por Serviço</h2>
                    {chartData.pie.length > 0 ? (
                        <ServicePieChart data={chartData.pie} />
                    ) : (
                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                            Sem dados...
                        </div>
                    )}
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
                                    {charge.client?.phone && (
                                        <a
                                            href={`https://wa.me/55${charge.client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                                `Olá ${charge.client.name}, segue sua fatura de ${charge.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} com vencimento em ${new Date(charge.dueDate).toLocaleDateString('pt-BR')}. Link: ${process.env.NEXT_PUBLIC_URL || window.location.origin}/fatura/${charge.id}`
                                            )}`}
                                            target="_blank"
                                            className="btn"
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                display: 'inline-block',
                                                marginRight: '0.5rem',
                                                background: '#25D366',
                                                color: 'white'
                                            }}
                                            title="Enviar por WhatsApp"
                                        >
                                            📱
                                        </a>
                                    )}
                                    {(charge.status === 'PENDENTE' || charge.status === 'VENCIDO') && (
                                        <button
                                            onClick={() => {
                                                if (confirm('Confirmar o recebimento deste valor? O cliente receberá o comprovante.')) {
                                                    handleMarkAsPaid(charge.id);
                                                }
                                            }}
                                            className="btn"
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                display: 'inline-block',
                                                marginRight: '0.5rem',
                                                background: '#10b981',
                                                color: 'white',
                                                border: 'none'
                                            }}
                                        >
                                            ✓ Receber
                                        </button>
                                    )}
                                    {charge.status === 'PENDENTE' && (
                                        <a
                                            href={`/admin/financeiro/cobranca/${charge.id}`}
                                            className="btn btn-primary"
                                            style={{
                                                padding: '0.5rem 1rem',
                                                fontSize: '0.875rem',
                                                display: 'inline-block',
                                                marginRight: '0.5rem'
                                            }}
                                        >
                                            💳 Link
                                        </a>
                                    )}
                                    {charge.status === 'VENCIDO' && (
                                        <>
                                            <button
                                                onClick={() => setUpdateDateModal({ isOpen: true, chargeId: charge.id })}
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

            {/* Modal for Update Date */}
            <Modal
                isOpen={updateDateModal.isOpen}
                onClose={() => setUpdateDateModal({ isOpen: false, chargeId: null })}
                title="Atualizar Vencimento"
            >
                <div>
                    <p style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>
                        Selecione a nova data de vencimento para esta cobrança. O status será redefinido para "Pendente" e um novo PDF será gerado.
                    </p>
                    <label className="label">Nova Data</label>
                    <input
                        type="date"
                        className="input"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        style={{ marginBottom: '1.5rem' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setUpdateDateModal({ isOpen: false, chargeId: null })}
                            className="btn btn-ghost"
                            style={{ width: 'auto' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdateDate}
                            disabled={!newDate}
                            className="btn btn-primary"
                        >
                            Confirmar Atualização
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
