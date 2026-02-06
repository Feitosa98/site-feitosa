'use client';

import { useState, useEffect } from 'react';
import { createTransaction, deleteTransaction, updateTransaction, getClientTransactions, getFinanceSummary } from '@/app/actions/portal/finance';
import { generateTelegramCode, getTelegramStatus } from '@/app/actions/telegram-auth';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

// Design Tokens
const colors = {
    primary: '#2C3E50',
    secondary: '#3498DB',
    accent: '#7F8C8D',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    success: '#27AE60',
    danger: '#C0392B',
    text: '#2C3E50',
    textLight: '#7F8C8D'
};

const CHART_COLORS = ['#3498DB', '#9B59B6', '#E67E22', '#2ECC71', '#F1C40F', '#E74C3C', '#95A5A6'];

export default function FinanceiroPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Date Filter State
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    // Telegram State
    const [showTelegramModal, setShowTelegramModal] = useState(false);
    const [telegramCode, setTelegramCode] = useState<string | null>(null);
    const [telegramStatus, setTelegramStatus] = useState<any>(null);

    // Transaction Form State
    const initialFormState = {
        id: '',
        description: '',
        value: '',
        type: 'EXPENSE',
        category: 'OUTROS',
        date: new Date().toISOString().split('T')[0],
        status: 'PAID'
    };
    const [formData, setFormData] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedMonth, selectedYear]);

    async function loadData() {
        try {
            setLoading(true);
            const [txs, sum, tgStatus] = await Promise.all([
                getClientTransactions(selectedMonth, selectedYear),
                getFinanceSummary(selectedMonth, selectedYear),
                getTelegramStatus('admin@email.com')
            ]);
            setTransactions(Array.isArray(txs) ? txs : []);
            setSummary(sum || { income: 0, expense: 0, balance: 0 });
            setTelegramStatus(tgStatus);
        } catch (error) {
            console.error('Failed to load data:', error);
            toast.error('Erro ao carregar dados. Tente atualizar a página.');
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }

    function handleOpenModal(transaction?: any) {
        if (transaction) {
            setFormData({
                id: transaction.id,
                description: transaction.description,
                value: String(transaction.value),
                type: transaction.type,
                category: transaction.category,
                date: new Date(transaction.date).toISOString().split('T')[0],
                status: transaction.status
            });
            setIsEditing(true);
        } else {
            setFormData({ ...initialFormState, date: new Date().toISOString().split('T')[0] });
            setIsEditing(false);
        }
        setShowModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        let res;
        if (isEditing && formData.id) {
            res = await updateTransaction(formData.id, formData);
        } else {
            res = await createTransaction(formData);
        }

        if (res?.success) {
            toast.success(isEditing ? 'Transação atualizada!' : 'Transação criada!');
            setShowModal(false);
            loadData();
        } else {
            toast.error('Erro ao salvar: ' + (res?.error || 'Erro desconhecido'));
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Tem certeza que deseja excluir?')) {
            await deleteTransaction(id);
            toast.success('Transação excluída');
            loadData();
        }
    }

    async function handleConnectTelegram() {
        const res = await generateTelegramCode('admin@email.com');
        if (res.success && res.code) {
            setTelegramCode(res.code);
            setShowTelegramModal(true);
            toast.success('Código gerado com sucesso! Siga as instruções.');
        } else {
            toast.error('Erro ao gerar código: ' + (res.error || 'Tente novamente.'));
        }
    }

    // Helper for icons
    const getCategoryIcon = (category: string) => {
        const icons: any = {
            'ALIMENTACAO': '🍔',
            'TRANSPORTE': '🚗',
            'MORADIA': '🏠',
            'LAZER': '🎉',
            'SAUDE': '💊',
            'SALARIO': '💰',
            'VENDAS': '📈',
            'OUTROS': '📝'
        };
        return icons[category] || '📝';
    };

    // Process data for chart
    const expensesByCategory = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((acc, curr) => {
            acc[curr.category] = (acc[curr.category] || 0) + curr.value;
            return acc;
        }, {} as Record<string, number>);

    const chartData = Object.keys(expensesByCategory).map(key => ({
        name: key,
        value: expensesByCategory[key]
    }));

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: colors.accent }}>
            Carregando dados...
        </div>
    );

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: colors.primary, letterSpacing: '-0.5px' }}>Visão Geral</h1>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            style={{ padding: '0.4rem', borderRadius: '6px', border: `1px solid ${colors.border}`, color: colors.primary, fontWeight: '600', cursor: 'pointer' }}
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            style={{ padding: '0.4rem', borderRadius: '6px', border: `1px solid ${colors.border}`, color: colors.primary, fontWeight: '600', cursor: 'pointer' }}
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    {telegramStatus?.connected ? (
                        <div style={{
                            background: '#F0F9FF',
                            color: '#0369A1',
                            border: '1px solid #BAE6FD',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontWeight: '500',
                            display: 'flex', alignItems: 'center', gap: '0.8rem',
                            fontSize: '0.9rem'
                        }}>
                            <div style={{
                                width: '32px', height: '32px',
                                background: '#0EA5E9', color: 'white',
                                borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.2rem'
                            }}>
                                ✈️
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0284C7' }}>Conectado</span>
                                <span style={{ fontWeight: '700' }}>
                                    {telegramStatus.username ? `@${telegramStatus.username}` : telegramStatus.name || 'Usuário'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnectTelegram}
                            style={{
                                background: 'white',
                                color: '#0088cc',
                                border: '1px solid #0088cc',
                                padding: '0.75rem 1.5rem',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span>✈️</span> Conectar Telegram
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        style={{
                            background: colors.secondary,
                            color: 'white',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px rgba(52, 152, 219, 0.2)',
                            transition: 'transform 0.2s',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>+</span> Nova Transação
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <SummaryCard title="Receitas" value={summary.income} color={colors.success} icon="↗" />
                <SummaryCard title="Despesas" value={summary.expense} color={colors.danger} icon="↘" />
                <SummaryCard title="Saldo do Mês" value={summary.balance} color={summary.balance >= 0 ? colors.success : colors.danger} icon="$" isTotal />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'start' }}>
                {/* Transactions List */}
                <div style={{ background: colors.cardBg, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                    <div style={{ padding: '1.5rem', borderBottom: `1px solid ${colors.border}` }}>
                        <h3 style={{ margin: 0, color: colors.primary, fontWeight: '700' }}>Últimas Transações</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#F8FAFC', color: colors.textLight, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Data</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Descrição</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Categoria</th>
                                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Valor</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? transactions.map((t, i) => (
                                    <tr key={t.id} style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : 'none' }}>
                                        <td style={{ padding: '1rem', color: colors.text }}>{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500', color: colors.primary }}>{t.description}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                padding: '4px 10px',
                                                borderRadius: '20px',
                                                background: '#EDF2F7',
                                                color: colors.text,
                                                fontWeight: '600',
                                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
                                            }}>
                                                <span>{getCategoryIcon(t.category)}</span> {t.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: t.type === 'INCOME' ? colors.success : colors.danger }}>
                                            {t.type === 'EXPENSE' ? '- ' : '+ '}
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleOpenModal(t)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    style={{ background: 'none', border: 'none', color: colors.danger, cursor: 'pointer', fontSize: '1.1rem' }}
                                                    title="Excluir"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: colors.textLight }}>
                                            Nenhuma transação registrada neste período.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chart Section */}
                <div style={{ background: colors.cardBg, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', padding: '1.5rem', border: `1px solid ${colors.border}`, height: 'fit-content' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: colors.primary, fontWeight: '700', fontSize: '1.1rem' }}>Despesas ({new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' })})</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.textLight, fontSize: '0.9rem' }}>
                                Sem dados para exibir
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(44, 62, 80, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        width: '450px',
                        maxWidth: '90%',
                        borderRadius: '16px',
                        padding: '2rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: colors.primary, fontWeight: '700' }}>
                            {isEditing ? 'Editar Transação' : 'Nova Transação'}
                        </h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: colors.text }}>Tipo</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        border: `2px solid ${formData.type === 'EXPENSE' ? colors.danger : colors.border}`,
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        color: formData.type === 'EXPENSE' ? colors.danger : colors.textLight,
                                        fontWeight: '600',
                                        background: formData.type === 'EXPENSE' ? '#FFF5F5' : 'white'
                                    }}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value="EXPENSE"
                                            checked={formData.type === 'EXPENSE'}
                                            onChange={() => setFormData({ ...formData, type: 'EXPENSE' })}
                                            style={{ display: 'none' }}
                                        />
                                        Saída
                                    </label>
                                    <label style={{
                                        flex: 1,
                                        padding: '0.8rem',
                                        border: `2px solid ${formData.type === 'INCOME' ? colors.success : colors.border}`,
                                        borderRadius: '8px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        color: formData.type === 'INCOME' ? colors.success : colors.textLight,
                                        fontWeight: '600',
                                        background: formData.type === 'INCOME' ? '#F0FFF4' : 'white'
                                    }}>
                                        <input
                                            type="radio"
                                            name="type"
                                            value="INCOME"
                                            checked={formData.type === 'INCOME'}
                                            onChange={() => setFormData({ ...formData, type: 'INCOME' })}
                                            style={{ display: 'none' }}
                                        />
                                        Entrada
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: colors.text }}>Descrição</label>
                                <input
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}`, outline: 'none' }}
                                    placeholder="Ex: Aluguel, Salário..."
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: colors.text }}>Valor</label>
                                    <input
                                        type="number" step="0.01"
                                        required
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}`, outline: 'none' }}
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: colors.text }}>Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}`, outline: 'none' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600', color: colors.text }}>Categoria</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}`, outline: 'none', background: 'white' }}
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

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: '#F1F2F6', color: colors.text, fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: 'none', background: colors.secondary, color: 'white', fontWeight: '600', cursor: 'pointer' }}
                                >
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Telegram Modal */}
            {showTelegramModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(44, 62, 80, 0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        width: '400px',
                        padding: '2rem',
                        borderRadius: '16px',
                        textAlign: 'center',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✈️</div>
                        <h2 style={{ color: '#2C3E50', marginBottom: '1rem' }}>Conectar Telegram</h2>
                        <p style={{ color: '#7F8C8D', marginBottom: '1.5rem' }}>
                            1. Abra o bot <strong>@FinanceiroFeitosaBot</strong> no Telegram.<br />
                            2. Envie o comando abaixo:
                        </p>
                        <div style={{
                            background: '#F1F2F6',
                            padding: '1rem',
                            borderRadius: '8px',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            letterSpacing: '2px',
                            marginBottom: '1.5rem',
                            color: '#2C3E50',
                            border: '2px dashed #BDC3C7'
                        }}>
                            /link {telegramCode}
                        </div>
                        <button
                            onClick={() => setShowTelegramModal(false)}
                            style={{
                                padding: '0.8rem 2rem',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#2C3E50',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ title, value, color, icon, isTotal }: any) {
    return (
        <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '140px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                <span style={{ color: '#7F8C8D', fontWeight: '600', fontSize: '0.95rem' }}>{title}</span>
                <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: `${color}20`,
                    color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold'
                }}>
                    {icon}
                </div>
            </div>
            <div style={{ zIndex: 1 }}>
                <span style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: isTotal ? color : '#2C3E50',
                    letterSpacing: '-1px'
                }}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                </span>
            </div>
            {/* Background decoration */}
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                fontSize: '8rem',
                opacity: 0.05,
                color: color,
                pointerEvents: 'none',
                fontWeight: '900'
            }}>
                $
            </div>
        </div>
    );
}
