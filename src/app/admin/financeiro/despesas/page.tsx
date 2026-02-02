'use client';

import { useState, useEffect } from 'react';
import { getExpenses, createExpense, deleteExpense } from '@/app/actions/expenses';
import Link from 'next/link';

interface Expense {
    id: string;
    description: string;
    category: string;
    value: number;
    date: string;
    notes: string | null;
}

const CATEGORIES = [
    { value: 'OPERACIONAL', label: 'Operacional', color: '#3b82f6' },
    { value: 'PESSOAL', label: 'Pessoal', color: '#8b5cf6' },
    { value: 'IMPOSTOS', label: 'Impostos', color: '#ef4444' },
    { value: 'INFRAESTRUTURA', label: 'Infraestrutura', color: '#f59e0b' },
    { value: 'MARKETING', label: 'Marketing', color: '#10b981' },
    { value: 'OUTROS', label: 'Outros', color: '#6b7280' }
];

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const loadExpenses = async () => {
        setLoading(true);
        const data = await getExpenses();
        setExpenses(data as any);
        setLoading(false);
    };

    useEffect(() => {
        loadExpenses();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await createExpense(formData);

        if (result.success) {
            setShowForm(false);
            loadExpenses();
            (e.target as HTMLFormElement).reset();
        } else {
            alert(result.message);
        }

        setFormLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;

        const result = await deleteExpense(id);
        if (result.success) {
            loadExpenses();
        } else {
            alert(result.message);
        }
    };

    const getCategoryBadge = (category: string) => {
        const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[CATEGORIES.length - 1];
        return (
            <span style={{
                fontSize: '0.75rem',
                background: `${cat.color}20`,
                color: cat.color,
                padding: '4px 10px',
                borderRadius: '1rem',
                fontWeight: '500'
            }}>
                {cat.label}
            </span>
        );
    };

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.value, 0);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>Gestão de Despesas</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                        {showForm ? '✕ Cancelar' : '➕ Nova Despesa'}
                    </button>
                    <Link href="/admin/financeiro" className="btn">
                        ← Voltar
                    </Link>
                </div>
            </div>

            {/* Summary Card */}
            <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total de Despesas</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                    R$ {totalExpenses.toFixed(2).replace('.', ',')}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.5rem' }}>
                    {expenses.length} despesa(s) registrada(s)
                </div>
            </div>

            {/* New Expense Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Nova Despesa</h2>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="label">Descrição</label>
                                    <input
                                        name="description"
                                        className="input"
                                        placeholder="Ex: Aluguel do escritório"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Categoria</label>
                                    <select name="category" className="input" required>
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="label">Valor (R$)</label>
                                    <input
                                        name="value"
                                        type="number"
                                        step="0.01"
                                        className="input"
                                        placeholder="0,00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Data</label>
                                    <input
                                        name="date"
                                        type="date"
                                        className="input"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="label">Observações (opcional)</label>
                                <textarea
                                    name="notes"
                                    className="input"
                                    rows={3}
                                    placeholder="Informações adicionais..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={formLoading}
                                >
                                    {formLoading ? 'Salvando...' : 'Salvar Despesa'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Descrição</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Categoria</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Data</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    Carregando...
                                </td>
                            </tr>
                        )}
                        {!loading && expenses.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    Nenhuma despesa cadastrada.
                                </td>
                            </tr>
                        )}
                        {!loading && expenses.map((expense) => (
                            <tr key={expense.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{expense.description}</div>
                                    {expense.notes && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                                            {expense.notes}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {getCategoryBadge(expense.category)}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {new Date(expense.date).toLocaleDateString('pt-BR')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: '#ef4444' }}>
                                    - R$ {expense.value.toFixed(2).replace('.', ',')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="btn"
                                        style={{
                                            padding: '0.5rem 1rem',
                                            fontSize: '0.875rem',
                                            background: '#fee2e2',
                                            color: '#991b1b',
                                            border: 'none'
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
