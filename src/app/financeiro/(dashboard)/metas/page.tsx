'use client';

import { useState, useEffect } from 'react';
import { getGoals, createGoal, updateGoal, deleteGoal } from '@/app/actions/finance-goals';
import { getCategories } from '@/app/actions/finance-categories';
import { toast } from 'sonner';

const colors = {
    primary: '#2C3E50',
    secondary: '#3498DB',
    border: '#E2E8F0',
    danger: '#C0392B',
    success: '#27AE60',
    text: '#2C3E50',
    textLight: '#7F8C8D',
    progressBg: '#EDF2F7'
};

export default function MetasPage() {
    const [goals, setGoals] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const initialFormState = {
        id: '',
        categoryId: '',
        amount: '',
        period: 'MONTHLY'
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [gs, cats] = await Promise.all([
            getGoals(),
            getCategories()
        ]);
        setGoals(gs);
        setCategories(cats);
        setLoading(false);
    }

    function handleOpenModal(goal?: any) {
        if (goal) {
            setFormData({
                id: goal.id,
                categoryId: goal.categoryId,
                amount: String(goal.amount),
                period: goal.period
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
            res = await updateGoal(formData.id, formData);
        } else {
            res = await createGoal(formData);
        }

        if (res.success) {
            toast.success(isEditing ? 'Meta atualizada!' : 'Meta criada!');
            setShowModal(false);
            loadData();
        } else {
            toast.error('Erro: ' + (res.error || 'Falha ao salvar'));
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            await deleteGoal(id);
            toast.success('Meta excluída');
            loadData();
        }
    }

    // Filter out categories that already have goals (unless editing)
    const availableCategories = categories.filter(c =>
        c.type === 'EXPENSE' &&
        (!goals.find(g => g.categoryId === c.id) || (isEditing && formData.categoryId === c.id))
    );

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: colors.primary }}>Metas & Orçamento</h1>
                    <p style={{ color: colors.textLight }}>Defina limites mensais para suas categorias</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    style={{
                        background: colors.secondary, color: 'white', border: 'none',
                        padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: '600', cursor: 'pointer'
                    }}
                >
                    + Nova Meta
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {goals.map(goal => (
                    <div key={goal.id} style={{
                        background: 'white', borderRadius: '16px', padding: '1.5rem',
                        border: `1px solid ${colors.border}`, boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: goal.category.color + '20', color: goal.category.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem'
                                }}>
                                    {goal.category.icon}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: colors.text }}>{goal.category.name}</h3>
                                    <span style={{ fontSize: '0.8rem', color: colors.textLight }}>Mensal</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleOpenModal(goal)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>✏️</button>
                                <button onClick={() => handleDelete(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}>🗑️</button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.primary }}>
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(goal.amount)}
                            </span>
                            <span style={{ fontSize: '0.9rem', color: colors.textLight }}> / mês</span>
                        </div>

                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#F8FAFC', borderRadius: '8px', fontSize: '0.85rem', color: colors.textLight, fontStyle: 'italic' }}>
                            O acompanhamento do progresso será exibido no Painel Principal.
                        </div>
                    </div>
                ))}
            </div>

            {goals.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: colors.textLight }}>
                    Nenhuma meta definida. Comece criando uma para controlar seus gastos!
                </div>
            )}

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{ background: 'white', width: '400px', maxWidth: '90%', borderRadius: '16px', padding: '2rem' }}>
                        <h2 style={{ marginBottom: '1.5rem', color: colors.primary }}>{isEditing ? 'Editar' : 'Nova'} Meta</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            {!isEditing && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Categoria</label>
                                    <select
                                        required
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}
                                    >
                                        <option value="">Selecione...</option>
                                        {availableCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Limite Mensal (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}
                                    placeholder="0,00"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '1rem', border: 'none', background: '#eee', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" style={{ flex: 1, padding: '1rem', border: 'none', background: colors.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
