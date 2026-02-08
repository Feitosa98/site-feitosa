'use client';

import { useState, useEffect } from 'react';
import { getMonthlyData, getExportData } from '@/app/actions/finance-reports';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ReportsPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 });

    useEffect(() => {
        loadData();
    }, [year]);

    async function loadData() {
        setLoading(true);
        try {
            const [chartData, exportData] = await Promise.all([
                getMonthlyData(year),
                getExportData(year)
            ]);

            setData(chartData);

            // Calculate stats
            const totalIncome = exportData.filter((t: any) => t.Tipo === 'Receita').reduce((acc: number, curr: any) => acc + curr.Valor, 0);
            const totalExpense = exportData.filter((t: any) => t.Tipo === 'Despesa').reduce((acc: number, curr: any) => acc + curr.Valor, 0);

            setStats({
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                transactionCount: exportData.length
            });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    async function handleExportExcel() {
        try {
            toast.loading('Gerando Excel...');
            const exportData = await getExportData(year);
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transações");
            XLSX.writeFile(wb, `Financeiro_${year}.xlsx`);
            toast.dismiss();
            toast.success('Excel gerado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error('Erro ao gerar Excel');
        }
    }

    async function handleExportPDF() {
        try {
            toast.loading('Gerando PDF...');
            const exportData = await getExportData(year);
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text(`Relatório Financeiro - ${year}`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);

            const totalIncome = exportData.filter((t: any) => t.Tipo === 'Receita').reduce((acc: number, curr: any) => acc + curr.Valor, 0);
            const totalExpense = exportData.filter((t: any) => t.Tipo === 'Despesa').reduce((acc: number, curr: any) => acc + curr.Valor, 0);

            doc.text(`Total Receitas: R$ ${totalIncome.toFixed(2)}`, 14, 32);
            doc.text(`Total Despesas: R$ ${totalExpense.toFixed(2)}`, 14, 38);
            doc.text(`Saldo: R$ ${(totalIncome - totalExpense).toFixed(2)}`, 14, 44);

            const tableColumn = ["Data", "Descrição", "Categoria", "Tipo", "Valor"];
            const tableRows: any[] = [];

            exportData.forEach((t: any) => {
                const transactionData = [
                    t.Data,
                    t.Descricao,
                    t.Categoria,
                    t.Tipo,
                    `R$ ${t.Valor.toFixed(2)}`
                ];
                tableRows.push(transactionData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 50,
            });

            doc.save(`Financeiro_${year}.pdf`);
            toast.dismiss();
            toast.success('PDF gerado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.dismiss();
            toast.error('Erro ao gerar PDF');
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <Link href="/financeiro" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-3 transition">
                            <span className="mr-2">←</span> Voltar
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Relatórios Avançados</h1>
                        <p className="text-slate-600 mt-2">Análise anual e exportação de dados</p>
                    </div>
                    <select
                        value={year}
                        onChange={e => setYear(Number(e.target.value))}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 hover:border-slate-300 transition cursor-pointer"
                    >
                        {[2023, 2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-600 font-semibold">Total Receitas</span>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">💰</div>
                        </div>
                        <p className="text-3xl font-black text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalIncome)}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-600 font-semibold">Total Despesas</span>
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-2xl">💸</div>
                        </div>
                        <p className="text-3xl font-black text-red-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalExpense)}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-600 font-semibold">Saldo Anual</span>
                            <div className={`w-12 h-12 ${stats.balance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-xl flex items-center justify-center text-2xl`}>
                                {stats.balance >= 0 ? '📈' : '📉'}
                            </div>
                        </div>
                        <p className={`text-3xl font-black ${stats.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.balance)}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-slate-600 font-semibold">Transações</span>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">📝</div>
                        </div>
                        <p className="text-3xl font-black text-purple-600">{stats.transactionCount}</p>
                        <p className="text-sm text-slate-500 mt-1">lançamentos no ano</p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-2xl font-bold text-slate-900 mb-6">Fluxo de Caixa Anual</h3>
                    <div className="h-96">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Carregando dados...
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#27AE60" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#C0392B" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#C0392B" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <Tooltip formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
                                    <Legend />
                                    <Area type="monotone" dataKey="income" name="Receitas" stroke="#27AE60" fillOpacity={1} fill="url(#colorIncome)" />
                                    <Area type="monotone" dataKey="expense" name="Despesas" stroke="#C0392B" fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Export Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200 hover:shadow-lg transition">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                                📊
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-green-900">Exportar Excel</h3>
                                <p className="text-green-700 text-sm">Formato .xlsx</p>
                            </div>
                        </div>
                        <p className="text-green-800 mb-6">
                            Baixe todos os lançamentos do ano em formato Excel para análise detalhada em planilhas.
                        </p>
                        <button
                            onClick={handleExportExcel}
                            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">📥</span> Download Excel
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-8 border border-red-200 hover:shadow-lg transition">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                                📄
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-red-900">Relatório PDF</h3>
                                <p className="text-red-700 text-sm">Pronto para impressão</p>
                            </div>
                        </div>
                        <p className="text-red-800 mb-6">
                            Gere um relatório completo em PDF com totais consolidados e lista detalhada de lançamentos.
                        </p>
                        <button
                            onClick={handleExportPDF}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">📥</span> Gerar PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
