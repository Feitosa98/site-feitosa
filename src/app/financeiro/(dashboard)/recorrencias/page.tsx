'use client';

import { useState, useEffect } from 'react';
import { getRecurrences, createRecurrence, updateRecurrence, deleteRecurrence, toggleRecurrence } from '@/app/actions/finance-recurrences';
import { getCategories } from '@/app/actions/finance-categories';
import { toast } from 'sonner';

const colors = {
    primary: '#2C3E50',
    secondary: '#3498DB',
    border: '#E2E8F0',
    danger: '#C0392B',
    success: '#27AE60',
    text: '#2C3E50',
    textLight: '#7F8C8D'
};

export default function RecurrenciasPage() {
    const [recurrences, setRecurrences] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const initialFormState = {
        id: '',
        description: '',
        value: '',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        categoryId: '',
        nextRun: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [recs, cats] = await Promise.all([
            getRecurrences(),
            getCategories()
        ]);
        setRecurrences(recs);
        setCategories(cats);
        setLoading(false);
    }

    function handleOpenModal(rec?: any) {
        if (rec) {
            setFormData({
                id: rec.id,
                description: rec.description,
                value: String(rec.value),
                type: rec.type,
                frequency: rec.frequency,
                categoryId: rec.categoryId || '',
                nextRun: new Date(rec.nextRun).toISOString().split('T')[0]
            });
            setIsEditing(true);
        } else {
            setFormData(initialFormState);
            setIsEditing(false);
        }
        setShowModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        let res;
        if (isEditing && formData.id) {
            res = await updateRecurrence(formData.id, formData);
        } else {
            res = await createRecurrence(formData);
        }

        if (res.success) {
            toast.success(isEditing ? 'Recorrência atualizada!' : 'Recorrência criada!');
            setShowModal(false);
            loadData();
        } else {
            toast.error('Erro: ' + (res.error || 'Falha ao salvar'));
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Tem certeza que deseja excluir esta recorrência?')) {
            await deleteRecurrence(id);
            toast.success('Excluída com sucesso');
            loadData();
        }
    }

    async function handleToggle(id: string, currentStatus: boolean) {
        await toggleRecurrence(id, !currentStatus);
        loadData();
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: colors.primary }}>Recorrências</h1>
                    <p style={{ color: colors.textLight }}>Gerencie suas contas fixas e assinaturas</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    style={{
                        background: colors.secondary, color: 'white', border: 'none',
                        padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                    }}
                >
                    + Nova
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', color: colors.textLight, fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Descrição</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Valor</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Frequência</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Próxima Execução</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recurrences.length > 0 ? recurrences.map((r, i) => (
                            <tr key={r.id} style={{ borderTop: i > 0 ? `1px solid ${colors.border}` : 'none' }}>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        onClick={() => handleToggle(r.id, r.active)}
                                        style={{
                                            border: 'none', background: r.active ? '#DEF7EC' : '#FDE8E8',
                                            color: r.active ? '#03543F' : '#9B1C1C',
                                            padding: '4px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer'
                                        }}
                                    >
                                        {r.active ? 'ATIVO' : 'PAUSADO'}
                                    </button>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: '500', color: colors.primary }}>
                                    {r.category?.icon} {r.description}
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 'bold', color: r.type === 'INCOME' ? colors.success : colors.danger }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r.value)}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {r.frequency === 'MONTHLY' ? 'Mensal' : 'Semanal'}
                                </td>
                                <td style={{ padding: '1rem', color: colors.textLight }}>
                                    {new Date(r.nextRun).toLocaleDateString('pt-BR')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                        <button onClick={() => handleOpenModal(r)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>✏️</button>
                                        <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: colors.textLight }}>Nenhuma recorrência cadastrada.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', width: '450px', maxWidth: '90%', borderRadius: '16px', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: colors.primary }}>{isEditing ? 'Editar' : 'Nova'} Recorrência</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Descrição</label>
                                <input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }} placeholder="Ex: Aluguel, Netflix..." />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Valor</label>
                                    <input type="number" step="0.01" required value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }} placeholder="0,00" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tipo</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                                        <option value="EXPENSE">Despesa</option>
                                        <option value="INCOME">Receita</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Frequência</label>
                                    <select value={formData.frequency} onChange={e => setFormData({ ...formData, frequency: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}>
                                        <option value="MONTHLY">Mensal</option>
                                        <option value="WEEKLY">Semanal</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Próxima Execução</label>
                                    <input type="date" required value={formData.nextRun} onChange={e => setFormData({ ...formData, nextRun: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Categoria</label>
                                <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}`, background: 'white' }}>
                                    <option value="">Sem categoria</option>
                                    {categories.filter(c => c.type === formData.type).map(c => (
                                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '1rem', border: 'none', background: '#eee', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                                <button type="submit" style={{ flex: 1, padding: '1rem', border: 'none', background: colors.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
