'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAssets } from '@/app/actions/assets';
import { createAsset, updateAsset } from '@/app/actions/portal/assets';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

export default function InventoryPage() {
    const { data: session } = useSession();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        value: '',
        purchaseDate: '',
        status: 'ATIVO'
    });

    useEffect(() => {
        const user = session?.user as any;
        if (user?.clientId) {
            loadAssets(user.clientId);
        }
    }, [session]);

    async function loadAssets(clientId: string) {
        setLoading(true);
        try {
            const data = await getAssets(clientId);
            setAssets(data);
        } catch (error) {
            console.error('Erro ao carregar inventário:', error);
        } finally {
            setLoading(false);
        }
    }

    const handleOpenModal = (asset?: any) => {
        if (asset) {
            setEditingId(asset.id);
            setFormData({
                name: asset.name,
                code: asset.code || '',
                description: asset.description || '',
                value: asset.value?.toString() || '',
                purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
                status: asset.status
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                description: '',
                value: '',
                purchaseDate: '',
                status: 'ATIVO'
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            setToast({ message: 'Nome é obrigatório', type: 'error' });
            return;
        }

        const res = editingId
            ? await updateAsset(editingId, formData)
            : await createAsset(formData);

        if (res.success) {
            setToast({ message: editingId ? 'Ativo atualizado!' : 'Ativo criado!', type: 'success' });
            setIsModalOpen(false);
            const user = session?.user as any;
            if (user?.clientId) loadAssets(user.clientId);
        } else {
            setToast({ message: res.error || 'Erro ao salvar', type: 'error' });
        }
    };

    const totalValue = assets.reduce((acc, asset) => acc + (asset.value || 0), 0);

    return (
        <div className="inventory-container">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Meu Inventário</h1>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn btn-primary no-print"
                    >
                        ➕ Novo Ativo
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="btn btn-outline no-print"
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando ativos...</div>
            ) : assets.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '3rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                    <p style={{ marginBottom: '1rem' }}>Nenhum item cadastrado no seu inventário.</p>
                    <button onClick={() => handleOpenModal()} className="btn btn-primary">Cadastrar Primeiro Item</button>
                </div>
            ) : (
                <>
                    <div className="report-header only-print" style={{ display: 'none', marginBottom: '2rem' }}>
                        <h2>Relatório de Inventário</h2>
                        <p>Cliente: {session?.user?.name}</p>
                        <p>Data: {new Date().toLocaleDateString()}</p>
                        <hr />
                    </div>

                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--card-bg)', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Nome/Descrição</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Código</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Data Compra</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }} className="no-print">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => (
                                    <tr key={asset.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{asset.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{asset.description}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{asset.code || '-'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {asset.value ? `R$ ${asset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                background: asset.status === 'ATIVO' ? '#d1fae5' : '#f3f4f6',
                                                color: asset.status === 'ATIVO' ? '#065f46' : '#374151'
                                            }}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }} className="no-print">
                                            <button
                                                onClick={() => handleOpenModal(asset)}
                                                className="btn btn-ghost"
                                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}
                                            >
                                                ✏️ Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: 'var(--card-bg)', fontWeight: 'bold' }}>
                                    <td colSpan={3} style={{ padding: '1rem', textAlign: 'right' }}>Total Estimado:</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Editar Ativo' : 'Novo Ativo'}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="label">Nome do Equipamento *</label>
                        <input
                            className="input"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Notebook Dell Latitude"
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label className="label">Código / Patrimônio</label>
                            <input
                                className="input"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Ex: PAT-001"
                            />
                        </div>
                        <div>
                            <label className="label">Valor (R$)</label>
                            <input
                                type="number"
                                className="input"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="label">Data de Aquisição</label>
                        <input
                            type="date"
                            className="input"
                            value={formData.purchaseDate}
                            onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Descrição / Detalhes</label>
                        <textarea
                            className="input"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Número de série, cor, modelo específico..."
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="label">Status</label>
                        <select
                            className="input"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="ATIVO">Ativo</option>
                            <option value="MANUTENCAO">Em Manutenção</option>
                            <option value="INATIVO">Inativo / Descartado</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancelar</button>
                        <button onClick={handleSave} className="btn btn-primary">Salvar</button>
                    </div>
                </div>
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .only-print {
                        display: block !important;
                    }
                    body {
                        background: white;
                        color: black;
                    }
                    nav, aside, header {
                        display: none !important;
                    }
                    .inventory-container {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
}
