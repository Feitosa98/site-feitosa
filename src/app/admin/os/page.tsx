'use client';

import { useState, useEffect } from 'react';
import { createOS, updateOSStatus, generateChargeFromOS } from '@/app/actions/os';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';

interface ServiceOrder {
    id: string;
    equipment: string;
    issue: string;
    status: string;
    notes: string;
    createdAt: string;
    client: {
        id: string;
        name: string;
    };
    chargeId: string | null;
}

interface Client {
    id: string;
    name: string;
}

export default function OSPage() {
    const [osList, setOSList] = useState<ServiceOrder[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Modals
    const [isNewOSModalOpen, setIsNewOSModalOpen] = useState(false);
    const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);

    // Forms
    const [newOS, setNewOS] = useState({ clientId: '', equipment: '', issue: '', notes: '' });
    const [chargeForm, setChargeForm] = useState({ osId: '', value: '', dueDate: '' });

    const loadData = async () => {
        setLoading(true);
        try {
            const [osRes, clientsRes] = await Promise.all([
                fetch('/api/os').then(r => r.json()),
                fetch('/api/clients').then(r => r.json())
            ]);
            setOSList(osRes);
            setClients(clientsRes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateOS = async () => {
        const res = await createOS(newOS);
        if (res.success) {
            setToast({ message: 'OS Criada com sucesso!', type: 'success' });
            setIsNewOSModalOpen(false);
            setNewOS({ clientId: '', equipment: '', issue: '', notes: '' });
            loadData();
        } else {
            setToast({ message: 'Erro ao criar OS', type: 'error' });
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        await updateOSStatus(id, newStatus);
        loadData();
    };

    const handleGenerateCharge = async () => {
        const res = await generateChargeFromOS(chargeForm.osId, chargeForm);
        if (res.success) {
            setToast({ message: 'Cobrança gerada com sucesso!', type: 'success' });
            setIsChargeModalOpen(false);
            loadData();
        } else {
            setToast({ message: res.error || 'Erro ao gerar cobrança', type: 'error' });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ABERTO': return '#3b82f6';
            case 'EM_ANDAMENTO': return '#f59e0b';
            case 'AGUARDANDO_PECA': return '#8b5cf6';
            case 'CONCLUIDO': return '#10b981';
            case 'CANCELADO': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>Ordens de Serviço</h1>
                <button onClick={() => setIsNewOSModalOpen(true)} className="btn btn-primary">
                    ➕ Nova OS
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Cliente</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Equipamento/Defeito</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</td></tr>}
                        {!loading && osList.map(os => (
                            <tr key={os.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>{os.client.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{os.equipment}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>{os.issue}</div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <select
                                        value={os.status}
                                        onChange={(e) => handleUpdateStatus(os.id, e.target.value)}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            border: `1px solid ${getStatusColor(os.status)}`,
                                            color: getStatusColor(os.status),
                                            background: 'transparent',
                                            fontWeight: '500'
                                        }}
                                    >
                                        <option value="ABERTO">Aberto</option>
                                        <option value="EM_ANDAMENTO">Em Andamento</option>
                                        <option value="AGUARDANDO_PECA">Aguardando Peça</option>
                                        <option value="CONCLUIDO">Concluído</option>
                                        <option value="CANCELADO">Cancelado</option>
                                    </select>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    {!os.chargeId && os.status !== 'CANCELADO' && (
                                        <button
                                            onClick={() => {
                                                setChargeForm({ ...chargeForm, osId: os.id });
                                                setIsChargeModalOpen(true);
                                            }}
                                            className="btn"
                                            style={{ fontSize: '0.875rem', background: '#10b981', color: 'white' }}
                                        >
                                            💲 Gerar Cobrança
                                        </button>
                                    )}
                                    {os.chargeId && (
                                        <span style={{ fontSize: '0.875rem', color: '#10b981' }}>✓ Cobrado</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* New OS Modal */}
            <Modal isOpen={isNewOSModalOpen} onClose={() => setIsNewOSModalOpen(false)} title="Nova Ordem de Serviço">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="label">Cliente</label>
                        <select
                            className="input"
                            value={newOS.clientId}
                            onChange={e => setNewOS({ ...newOS, clientId: e.target.value })}
                        >
                            <option value="">Selecione um cliente...</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Equipamento</label>
                        <input
                            className="input"
                            value={newOS.equipment}
                            onChange={e => setNewOS({ ...newOS, equipment: e.target.value })}
                            placeholder="Ex: Notebook dell, Impressora..."
                        />
                    </div>
                    <div>
                        <label className="label">Defeito / Solicitação</label>
                        <textarea
                            className="input"
                            value={newOS.issue}
                            onChange={e => setNewOS({ ...newOS, issue: e.target.value })}
                            placeholder="Descreva o problema..."
                        />
                    </div>
                    <button onClick={handleCreateOS} className="btn btn-primary" disabled={!newOS.clientId || !newOS.issue}>
                        Criar OS
                    </button>
                </div>
            </Modal>

            {/* Generate Charge Modal */}
            <Modal isOpen={isChargeModalOpen} onClose={() => setIsChargeModalOpen(false)} title="Gerar Cobrança da OS">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label className="label">Valor do Serviço (R$)</label>
                        <input
                            type="number"
                            className="input"
                            value={chargeForm.value}
                            onChange={e => setChargeForm({ ...chargeForm, value: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Vencimento</label>
                        <input
                            type="date"
                            className="input"
                            value={chargeForm.dueDate}
                            onChange={e => setChargeForm({ ...chargeForm, dueDate: e.target.value })}
                        />
                    </div>
                    <button onClick={handleGenerateCharge} className="btn btn-primary" disabled={!chargeForm.value || !chargeForm.dueDate}>
                        Confirmar e Gerar
                    </button>
                </div>
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
