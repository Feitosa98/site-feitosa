'use client';

import { saveAsset, getAssets, deleteAsset } from '@/app/actions/assets';
import { getClients } from '@/app/actions/clients';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function InventoryAdminPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAsset, setEditingAsset] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        const [assetsData, clientsData] = await Promise.all([
            getAssets(),
            getClients()
        ]);
        setAssets(assetsData);
        setClients(clientsData);
        setLoading(false);
    }

    async function handleSubmit(formData: FormData) {
        const res = await saveAsset(formData);
        if (res.success) {
            setShowForm(false);
            setEditingAsset(null);
            loadData();
        } else {
            alert(res.message);
        }
    }

    async function handleDelete(id: string) {
        if (confirm('Tem certeza que deseja excluir este ativo?')) {
            const res = await deleteAsset(id);
            if (res.success) {
                loadData();
            } else {
                alert(res.message);
            }
        }
    }

    return (
        <div className="p-4 md:p-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>📋 Gestão de Inventário</h1>
                <button
                    onClick={() => { setEditingAsset(null); setShowForm(true); }}
                    className="btn btn-primary"
                >
                    ➕ Novo Ativo
                </button>
            </div>

            {showForm && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingAsset ? 'Editar Ativo' : 'Novo Ativo'}</h2>
                        <form action={handleSubmit}>
                            {editingAsset && <input type="hidden" name="id" value={editingAsset.id} />}

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <label className="label">Cliente</label>
                                    <select name="clientId" className="input" defaultValue={editingAsset?.clientId} required>
                                        <option value="">Selecione um cliente...</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.cpfCnpj})</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="label">Nome do Ativo</label>
                                        <input name="name" className="input" defaultValue={editingAsset?.name} required placeholder="Ex: Notebook Dell" />
                                    </div>
                                    <div>
                                        <label className="label">Código/Série</label>
                                        <input name="code" className="input" defaultValue={editingAsset?.code} placeholder="Identificador único" />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Descrição</label>
                                    <textarea name="description" className="input" defaultValue={editingAsset?.description} rows={3} placeholder="Detalhes técnicos, localização, etc." />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="label">Valor (R$)</label>
                                        <input name="value" type="number" step="0.01" className="input" defaultValue={editingAsset?.value} placeholder="0,00" />
                                    </div>
                                    <div>
                                        <label className="label">Data de Compra</label>
                                        <input name="purchaseDate" type="date" className="input" defaultValue={editingAsset?.purchaseDate?.split('T')[0]} />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Status</label>
                                    <select name="status" className="input" defaultValue={editingAsset?.status || 'ATIVO'}>
                                        <option value="ATIVO">✅ Ativo</option>
                                        <option value="MANUTENCAO">🔧 Manutenção</option>
                                        <option value="INATIVO">❌ Inativo</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost">Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Ativo</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Cliente</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Código</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados...</td></tr>
                            ) : assets.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>Nenhum ativo cadastrado.</td></tr>
                            ) : (
                                assets.map(asset => (
                                    <tr key={asset.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '500' }}>{asset.name}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{asset.description?.substring(0, 50)}...</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{asset.client?.name}</td>
                                        <td style={{ padding: '1rem' }}><code>{asset.code || '-'}</code></td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold',
                                                backgroundColor: asset.status === 'ATIVO' ? 'rgba(16, 185, 129, 0.1)' : asset.status === 'MANUTENCAO' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: asset.status === 'ATIVO' ? '#10b981' : asset.status === 'MANUTENCAO' ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {asset.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => { setEditingAsset(asset); setShowForm(true); }}
                                                    className="btn btn-ghost" style={{ padding: '5px' }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(asset.id)}
                                                    className="btn btn-ghost" style={{ padding: '5px', color: '#ef4444' }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
