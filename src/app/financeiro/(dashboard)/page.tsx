'use client';

import Link from 'next/link';
import { getCategories, seedDefaultCategories } from '@/app/actions/finance-categories';
import { getGoals } from '@/app/actions/finance-goals';
import { useState, useEffect } from 'react';
import { createTransaction, deleteTransaction, updateTransaction, getClientTransactions, getFinanceSummary } from '@/app/actions/portal/finance';
import { generateTelegramCode, getTelegramStatus } from '@/app/actions/telegram-auth';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const CHART_COLORS = ['#3498DB', '#9B59B6', '#E67E22', '#2ECC71', '#F1C40F', '#E74C3C', '#95A5A6'];

// Quick Access Navigation Cards
const QuickAccessCard = ({ href, icon, title, description, gradient }: any) => (
    <Link href={href}>
        <div className={`group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${gradient} text-white cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
            <div className="relative z-10">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="text-lg font-bold mb-1">{title}</h3>
                <p className="text-sm opacity-90">{description}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 group-hover:opacity-20 transition-opacity">
                {icon}
            </div>
        </div>
    </Link>
);

export default function FinanceiroPage() {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
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
        categoryId: '',
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

            let cats = await getCategories();
            if (cats.length === 0) {
                await seedDefaultCategories();
                cats = await getCategories();
            }
            setCategories(cats);

            const [txs, sum, tgStatus, goalData] = await Promise.all([
                getClientTransactions(selectedMonth, selectedYear),
                getFinanceSummary(selectedMonth, selectedYear),
                getTelegramStatus(),
                getGoals()
            ]);
            setTransactions(Array.isArray(txs) ? txs : []);
            setSummary(sum || { income: 0, expense: 0, balance: 0 });
            setTelegramStatus(tgStatus);
            setGoals(goalData);
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
            let catId = transaction.categoryId;
            if (!catId && transaction.category) {
                const found = categories.find(c => c.name === transaction.category);
                if (found) catId = found.id;
            }

            setFormData({
                id: transaction.id,
                description: transaction.description,
                value: String(transaction.value),
                type: transaction.type,
                category: transaction.category,
                categoryId: catId || '',
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

        const selectedCat = categories.find(c => c.id === formData.categoryId);
        const submissionData = {
            ...formData,
            category: selectedCat ? selectedCat.name : formData.category,
            categoryId: formData.categoryId
        };

        let res;
        if (isEditing && formData.id) {
            res = await updateTransaction(formData.id, submissionData);
        } else {
            res = await createTransaction(submissionData);
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
        const res = await generateTelegramCode();
        if (res.success && res.code) {
            setTelegramCode(res.code);
            setShowTelegramModal(true);
            toast.success('Código gerado com sucesso! Siga as instruções.');
        } else {
            toast.error('Erro ao gerar código: ' + (res.error || 'Tente novamente.'));
        }
    }

    const getCategoryIcon = (t: any) => {
        if (t.categoryRel?.icon) return t.categoryRel.icon;
        const found = categories.find(c => c.name === t.category);
        if (found?.icon) return found.icon;
        const icons: any = {
            'ALIMENTACAO': '🍔', 'TRANSPORTE': '🚗', 'MORADIA': '🏠',
            'LAZER': '🎉', 'SAUDE': '💊', 'SALARIO': '💰',
            'VENDAS': '📈', 'OUTROS': '📝'
        };
        return icons[t.category] || '📝';
    };

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
        <div className="flex justify-center items-center min-h-screen">
            <div className="text-zinc-500 text-lg">Carregando dados...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 space-y-8">
            {/* Header */}
            <div className="flex justify-between items-start flex-wrap gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Visão Geral</h1>
                    <p className="text-slate-600 mt-2">Gerencie suas finanças de forma inteligente</p>
                    <div className="flex gap-3 mt-4">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:border-slate-300 transition cursor-pointer"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('pt-BR', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:border-slate-300 transition cursor-pointer"
                        >
                            {[2024, 2025, 2026, 2027].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-3 flex-wrap">
                    {telegramStatus?.connected ? (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 px-6 py-3 rounded-xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-xl">✈️</div>
                            <div>
                                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Conectado</p>
                                <p className="font-bold text-blue-900">{telegramStatus.username ? `@${telegramStatus.username}` : telegramStatus.name || 'Usuário'}</p>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleConnectTelegram}
                            className="bg-white border-2 border-blue-500 text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition flex items-center gap-2"
                        >
                            <span>✈️</span> Conectar Telegram
                        </button>
                    )}
                    <button
                        onClick={() => handleOpenModal()}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Nova Transação
                    </button>
                </div>
            </div>

            {/* Quick Access Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickAccessCard
                    href="/financeiro/cartoes"
                    icon="💳"
                    title="Meus Cartões"
                    description="Gerencie limites e faturas"
                    gradient="from-purple-500 to-purple-700"
                />
                <QuickAccessCard
                    href="/financeiro/relatorios"
                    icon="📊"
                    title="Relatórios"
                    description="Análises e exportações"
                    gradient="from-emerald-500 to-emerald-700"
                />
                <QuickAccessCard
                    href="/financeiro/metas"
                    icon="🎯"
                    title="Metas"
                    description="Defina seus objetivos"
                    gradient="from-amber-500 to-amber-700"
                />
                <QuickAccessCard
                    href="/financeiro/categorias"
                    icon="🏷️"
                    title="Categorias"
                    description="Organize seus gastos"
                    gradient="from-rose-500 to-rose-700"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-600 font-semibold">Receitas</span>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">↗</div>
                    </div>
                    <p className="text-3xl font-black text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.income)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-600 font-semibold">Despesas</span>
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">↘</div>
                    </div>
                    <p className="text-3xl font-black text-red-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.expense)}
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-slate-600 font-semibold">Saldo do Mês</span>
                        <div className={`w-12 h-12 ${summary.balance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-xl flex items-center justify-center text-2xl`}>$</div>
                    </div>
                    <p className={`text-3xl font-black ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.balance)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transactions List */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-xl font-bold text-slate-900">Últimas Transações</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr className="text-slate-600 text-sm font-semibold uppercase tracking-wide">
                                    <th className="p-4 text-left">Data</th>
                                    <th className="p-4 text-left">Descrição</th>
                                    <th className="p-4 text-left">Categoria</th>
                                    <th className="p-4 text-right">Valor</th>
                                    <th className="p-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length > 0 ? transactions.map((t, i) => (
                                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50 transition">
                                        <td className="p-4 text-slate-700">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-4 font-semibold text-slate-900">{t.description}</td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm font-medium">
                                                <span>{getCategoryIcon(t)}</span> {t.categoryRel?.name || t.category}
                                            </span>
                                        </td>
                                        <td className={`p-4 text-right font-bold ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'EXPENSE' ? '- ' : '+ '}
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => handleOpenModal(t)} className="hover:scale-110 transition text-xl" title="Editar">✏️</button>
                                                <button onClick={() => handleDelete(t.id)} className="hover:scale-110 transition text-xl" title="Excluir">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="p-12 text-center text-slate-500">
                                            Nenhuma transação registrada neste período.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">
                        Despesas ({new Date(selectedYear, selectedMonth - 1).toLocaleString('pt-BR', { month: 'long' })})
                    </h3>
                    <div className="h-64">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
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
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Sem dados para exibir
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Budget Section */}
            <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Orçamento Mensal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {goals.length > 0 ? goals.map(goal => {
                        const spent = expensesByCategory[goal.category.name] || 0;
                        const percentage = Math.min((spent / goal.amount) * 100, 100);
                        const isOver = spent > goal.amount;
                        const remaining = goal.amount - spent;

                        return (
                            <div key={goal.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{goal.category.icon}</span>
                                        <span className="font-bold text-slate-900">{goal.category.name}</span>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${isOver ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {isOver ? 'Excedido' : 'OK'}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm text-slate-600 mb-2">
                                    <span>Gasto: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(spent)}</span>
                                    <span>Meta: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.amount)}</span>
                                </div>

                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : (percentage > 80 ? 'bg-yellow-500' : 'bg-green-500')}`}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>

                                <p className="text-xs text-slate-500 mt-2 text-right">
                                    {isOver
                                        ? `Excedeu ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(remaining))}`
                                        : `Resta ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)}`
                                    }
                                </p>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                            <p className="text-slate-500">Nenhuma meta definida. Configure suas metas na aba "Metas".</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 text-slate-900">
                            {isEditing ? 'Editar Transação' : 'Nova Transação'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`p-4 border-2 rounded-xl text-center cursor-pointer font-semibold transition ${formData.type === 'EXPENSE' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                                        <input type="radio" name="type" value="EXPENSE" checked={formData.type === 'EXPENSE'} onChange={() => setFormData({ ...formData, type: 'EXPENSE' })} className="hidden" />
                                        Saída
                                    </label>
                                    <label className={`p-4 border-2 rounded-xl text-center cursor-pointer font-semibold transition ${formData.type === 'INCOME' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                                        <input type="radio" name="type" value="INCOME" checked={formData.type === 'INCOME'} onChange={() => setFormData({ ...formData, type: 'INCOME' })} className="hidden" />
                                        Entrada
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Descrição</label>
                                <input
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
                                    placeholder="Ex: Aluguel, Salário..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Valor</label>
                                    <input
                                        type="number" step="0.01"
                                        required
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Categoria</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition bg-white"
                                >
                                    <option value="">Selecione...</option>
                                    {categories.filter(c => c.type === formData.type).map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 p-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md p-8 rounded-2xl text-center shadow-2xl">
                        <div className="text-6xl mb-4">✈️</div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Conectar Telegram</h2>
                        <p className="text-slate-600 mb-6">
                            1. Abra o bot <strong>@FinanceiroFeitosaBot</strong> no Telegram.<br />
                            2. Envie o comando abaixo:
                        </p>
                        <div className="bg-slate-100 p-4 rounded-xl text-2xl font-mono font-bold text-slate-900 mb-6 border-2 border-dashed border-slate-300">
                            /link {telegramCode}
                        </div>
                        <button
                            onClick={() => setShowTelegramModal(false)}
                            className="w-full p-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
