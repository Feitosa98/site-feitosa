'use client';

import { useState, useEffect } from 'react';
import { createTransaction, deleteTransaction, getClientTransactions, getFinanceSummary } from '@/app/actions/portal/finance';

export default function FinanceiroPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // New Transaction Form State
    const [formData, setFormData] = useState({
        description: '',
        value: '',
        type: 'EXPENSE',
        category: 'OUTROS',
        date: new Date().toISOString().split('T')[0],
        status: 'PAID'
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [txs, sum] = await Promise.all([
            getClientTransactions(),
            getFinanceSummary()
        ]);
        setTransactions(txs);
        setSummary(sum);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        await createTransaction(formData);
        setShowModal(false);
        setFormData({ ...formData, description: '', value: '' });
        loadData();
    }

    async function handleDelete(id: string) {
        if (confirm('Tem certeza que deseja excluir?')) {
            await deleteTransaction(id);
            loadData();
        }
    }

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Meu Financeiro</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowModal(true)}
                >
                    + Nova Transação
                </button>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card">
                    <div className="label" style={{ color: '#10b981' }}>Receitas</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.income)}
                    </div>
                </div>
                <div className="card">
                    <div className="label" style={{ color: '#ef4444' }}>Despesas</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.expense)}
                    </div>
                </div>
                <div className="card">
                    <div className="label">Saldo Atual</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: summary.balance >= 0 ? '#10b981' : '#ef4444' }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.balance)}
                    </div>
                </div>
            </div>

            {/* Transactions List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="table" style={{ width: '100%' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Data</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Descrição</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Categoria</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t.id} style={{ borderTop: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div>{t.description}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t.status === 'PAID' ? 'Pago' : 'Pendente'}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                                        {t.category}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: t.type === 'INCOME' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                                    {t.type === 'EXPENSE' ? '-' : '+'}
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                    Nenhuma transação encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Nova Transação</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label className="label">Tipo</label>
                                <select
                                    className="input"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="EXPENSE">Despesa (Saída)</option>
                                    <option value="INCOME">Receita (Entrada)</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Descrição</label>
                                <input
                                    className="input"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="label">Valor</label>
                                    <input
                                        type="number" step="0.01"
                                        className="input"
                                        required
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Data</label>
                                    <input
                                        type="date"
                                        className="input"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Categoria</label>
                                <select
                                    className="input"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="OUTROS">Outros</option>
                                    <option value="ALIMENTACAO">Alimentação</option>
                                    <option value="TRANSPORTE">Transporte</option>
                                    <option value="MORADIA">Moradia</option>
                                    <option value="LAZER">Lazer</option>
                                    <option value="SAUDE">Saúde</option>
                                    <option value="SALARIO">Salário</option>
                                    <option value="VENDAS">Vendas</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
