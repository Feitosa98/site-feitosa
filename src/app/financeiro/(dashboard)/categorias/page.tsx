'use client';

import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/app/actions/finance-categories';
import { toast } from 'sonner';
import Link from 'next/link';

const colors = {
    primary: '#2C3E50',
    secondary: '#3498DB',
    background: '#F8FAFC',
    cardBg: '#FFFFFF',
    border: '#E2E8F0',
    danger: '#C0392B',
    text: '#2C3E50',
    textLight: '#7F8C8D'
};

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const initialFormState = {
        id: '',
        name: '',
        icon: '📝',
        color: '#3498DB',
        type: 'EXPENSE'
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const cats = await getCategories();
        setCategories(cats);
        setLoading(false);
    }

    function handleOpenModal(category?: any) {
        if (category) {
            setFormData({
                id: category.id,
                name: category.name,
                icon: category.icon,
                color: category.color,
                type: category.type
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
            res = await updateCategory(formData.id, formData);
        } else {
            res = await createCategory(formData);
        }

        if (res.success) {
            toast.success(isEditing ? 'Categoria atualizada!' : 'Categoria criada!');
            setShowModal(false);
            loadData();
        } else {
            toast.error('Erro: ' + (res.error || 'Falha ao salvar'));
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Tem certeza? Isso pode falhar se houver transações vinculadas.')) {
            const res = await deleteCategory(id);
            if (res.success) {
                toast.success('Categoria excluída!');
                loadData();
            } else {
                toast.error('Erro: ' + (res.error || 'Falha ao excluir'));
            }
        }
    }

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;

    return (
        <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link href="/financeiro" style={{ textDecoration: 'none', fontSize: '1.5rem' }}>⬅️</Link>
                    <h1 style={{ fontSize: '2rem', fontWeight: '800', color: colors.primary }}>Categorias</h1>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    style={{
                        background: colors.secondary,
                        color: 'white',
                        border: 'none',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    + Nova Categoria
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {categories.map(cat => (
                    <div key={cat.id} style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        border: `1px solid ${colors.border}`,
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{
                                width: '50px', height: '50px',
                                borderRadius: '12px',
                                background: cat.color + '20',
                                color: cat.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.8rem'
                            }}>
                                {cat.icon}
                            </div>
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                color: cat.type === 'EXPENSE' ? colors.danger : colors.secondary,
                                background: cat.type === 'EXPENSE' ? '#FFF5F5' : '#F0F9FF',
                                padding: '4px 8px',
                                borderRadius: '6px'
                            }}>
                                {cat.type === 'EXPENSE' ? 'Despesa' : 'Receita'}
                            </span>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: colors.text }}>{cat.name}</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <button
                                onClick={() => handleOpenModal(cat)}
                                style={{ flex: 1, padding: '0.5rem', border: `1px solid ${colors.border}`, borderRadius: '6px', background: 'transparent', cursor: 'pointer', fontWeight: '500', color: colors.text }}
                            >
                                Editar
                            </button>
                            <button
                                onClick={() => handleDelete(cat.id)}
                                style={{ flex: 1, padding: '0.5rem', border: `1px solid ${colors.danger}40`, borderRadius: '6px', background: '#FFF5F5', cursor: 'pointer', fontWeight: '500', color: colors.danger }}
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        width: '400px',
                        maxWidth: '90%',
                        borderRadius: '16px',
                        padding: '2rem',
                    }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{isEditing ? 'Editar' : 'Nova'} Categoria</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Nome</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Ícone (Emoji)</label>
                                    <input
                                        value={formData.icon}
                                        onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}`, textAlign: 'center', fontSize: '1.5rem' }}
                                        maxLength={2}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Cor</label>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        style={{ width: '100%', height: '50px', padding: '0', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Tipo</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: `1px solid ${colors.border}` }}
                                >
                                    <option value="EXPENSE">Despesa</option>
                                    <option value="INCOME">Receita</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '1rem', border: 'none', background: '#eee', borderRadius: '8px', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ flex: 1, padding: '1rem', border: 'none', background: colors.secondary, color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Salvar
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
