'use client';

import { useState, useEffect } from 'react';
import { getMonthlyData, getExportData } from '@/app/actions/finance-reports';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const colors = {
    primary: '#2C3E50',
    secondary: '#3498DB',
    border: '#E2E8F0',
    success: '#27AE60',
    danger: '#C0392B',
    text: '#2C3E50',
    textLight: '#7F8C8D'
};

export default function ReportsPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [year]);

    async function loadData() {
        setLoading(true);
        try {
            const chartData = await getMonthlyData(year);
            setData(chartData);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }

    async function handleExportExcel() {
        try {
            const exportData = await getExportData(year);
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transações");
            XLSX.writeFile(wb, `Financeiro_${year}.xlsx`);
            toast.success('Excel gerado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao gerar Excel');
        }
    }

    async function handleExportPDF() {
        try {
            const exportData = await getExportData(year);
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text(`Relatório Financeiro - ${year}`, 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);

            // Calculate totals
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
            toast.success('PDF gerado com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao gerar PDF');
        }
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: colors.primary }}>Relatórios Avançados</h1>
                    <p style={{ color: colors.textLight }}>Análise anual e exportação de dados</p>
                </div>
                <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    style={{ padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}`, fontSize: '1rem', fontWeight: 'bold' }}
                >
                    {[2023, 2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* Chart Section */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: `1px solid ${colors.border}`, marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', color: colors.primary, fontWeight: '700' }}>Fluxo de Caixa Anual</h3>
                <div style={{ height: '400px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors.success} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={colors.success} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors.danger} stopOpacity={0.8} />
                                    <stop offset="95%" stopColor={colors.danger} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <Tooltip formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))} />
                            <Legend />
                            <Area type="monotone" dataKey="income" name="Receitas" stroke={colors.success} fillOpacity={1} fill="url(#colorIncome)" />
                            <Area type="monotone" dataKey="expense" name="Despesas" stroke={colors.danger} fillOpacity={1} fill="url(#colorExpense)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Export Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                    <h3 style={{ marginBottom: '0.5rem', color: colors.primary }}>Exportar Excel</h3>
                    <p style={{ color: colors.textLight, marginBottom: '1.5rem' }}>Baixe todos os lançamentos do ano em formato .xlsx para análise detalhada.</p>
                    <button
                        onClick={handleExportExcel}
                        style={{ width: '100%', padding: '0.8rem', background: '#217346', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Download Excel
                    </button>
                </div>

                <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', border: `1px solid ${colors.border}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                    <h3 style={{ marginBottom: '0.5rem', color: colors.primary }}>Relatório PDF</h3>
                    <p style={{ color: colors.textLight, marginBottom: '1.5rem' }}>Gere um relatório pronto para impressão com totais e lista de lançamentos.</p>
                    <button
                        onClick={handleExportPDF}
                        style={{ width: '100%', padding: '0.8rem', background: '#D32F2F', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        Gerar PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
