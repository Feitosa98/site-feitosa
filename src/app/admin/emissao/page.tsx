'use client';

import { getClients } from '@/app/actions/clients';
import { submitNFSe } from '@/app/actions/nfse';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Toast from '@/components/Toast';

export default function EmissaoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [emittedNote, setEmittedNote] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null); // Type updated for Toast compatibility

    // Form State
    const [formData, setFormData] = useState({
        clientName: '',
        clientCpfCnpj: '',
        clientEmail: '',
        serviceCode: '01.07', // Default: Suporte Técnico
        value: '',
        description: '',
        // Address
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        cidadeIbge: '1302603', // Manaus
        uf: 'AM'
    });

    // Load clients for selection
    useEffect(() => {
        getClients().then(setClients);
    }, []);

    const handleSelectClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const clientId = e.target.value;
        if (!clientId) return;

        const client = clients.find(c => c.id === clientId);
        if (client) {
            setFormData(prev => ({
                ...prev,
                clientName: client.name,
                clientCpfCnpj: client.cpfCnpj,
                clientEmail: client.email || '',
                // If client had structured address, we would pre-fill here.
                // Assuming client only has basic info for now based on current schema usage.
            }));
        }
    };

    const handleCepBlur = async () => {
        const cep = formData.cep.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        logradouro: data.logradouro,
                        bairro: data.bairro,
                        uf: data.uf,
                        cidadeIbge: data.ibge
                    }));
                }
            } catch (e) {
                console.error('Erro ao buscar CEP');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setEmittedNote(null);

        const payload = {
            numeroDps: Date.now().toString().slice(-8), // Mock sequential
            tomadorNome: formData.clientName,
            tomadorCpfCnpj: formData.clientCpfCnpj,
            descricao: formData.description,
            valor: formData.value,
            endereco: {
                cep: formData.cep,
                logradouro: formData.logradouro,
                numero: formData.numero,
                bairro: formData.bairro,
                cidadeIbge: formData.cidadeIbge,
                uf: formData.uf
            }
        };

        try {
            const result = await submitNFSe(payload);

            if (result.success) {
                setEmittedNote({
                    message: 'XML Assinado e Enviado',
                    xml: result.xml // Mock return
                });
                setToast({ message: 'NFS-e Emitida com sucesso!', type: 'success' });
            } else {
                setToast({ message: result.error || 'Erro na emissão', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro ao processar emissão.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleNewEmission = () => {
        setEmittedNote(null);
        setFormData(prev => ({ ...prev, description: '', value: '' })); // Reset key fields
    };

    // Success Screen
    if (emittedNote) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#10b981' }}>
                        Processo Concluído
                    </h1>
                    <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
                        NFS-e gerada e assinada com sucesso.
                    </p>

                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', overflowX: 'auto', textAlign: 'left', fontSize: '0.75rem', marginBottom: '2rem', border: '1px solid var(--border)' }}>
                        <pre>{emittedNote.xml}</pre>
                    </div>

                    <button
                        onClick={handleNewEmission}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        ➕ Emitir Nova NFS-e
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Nova Emissão de NFS-e</h1>

            <div className="card">
                <form onSubmit={handleSubmit}>

                    {/* Client Selection */}
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px dashed var(--border)' }}>
                        <label className="label">🔍 Buscar Cliente Cadastrado (Opcional)</label>
                        <select className="input" onChange={handleSelectClient} defaultValue="">
                            <option value="">-- Selecione para preencher --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.cpfCnpj})</option>
                            ))}
                        </select>
                    </div>

                    {/* Tomador Info */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>Dados do Tomador</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">Nome/Razão Social *</label>
                            <input
                                className="input"
                                required
                                value={formData.clientName}
                                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">CPF/CNPJ *</label>
                            <input
                                className="input"
                                required
                                value={formData.clientCpfCnpj}
                                onChange={e => setFormData({ ...formData, clientCpfCnpj: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Endereço */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', marginTop: '1.5rem' }}>Endereço do Tomador</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">CEP *</label>
                            <input
                                className="input"
                                required
                                placeholder="00000-000"
                                value={formData.cep}
                                onChange={e => setFormData({ ...formData, cep: e.target.value })}
                                onBlur={handleCepBlur}
                            />
                        </div>
                        <div>
                            <label className="label">Logradouro *</label>
                            <input
                                className="input"
                                required
                                value={formData.logradouro}
                                onChange={e => setFormData({ ...formData, logradouro: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">Número *</label>
                            <input
                                className="input"
                                required
                                value={formData.numero}
                                onChange={e => setFormData({ ...formData, numero: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">Bairro *</label>
                            <input
                                className="input"
                                required
                                value={formData.bairro}
                                onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label">UF *</label>
                            <input
                                className="input"
                                required
                                value={formData.uf}
                                maxLength={2}
                                onChange={e => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                            />
                        </div>
                    </div>

                    {/* Serviço */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', marginTop: '1.5rem' }}>Dados do Serviço</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Código (LC 116) *</label>
                        <select
                            className="input"
                            value={formData.serviceCode}
                            onChange={e => setFormData({ ...formData, serviceCode: e.target.value })}
                        >
                            <option value="01.07">01.07 - Suporte Técnico em Informática</option>
                            <option value="01.01">01.01 - Análise e Desenv. de Sistemas</option>
                            <option value="01.06">01.06 - Consultoria em Informática</option>
                            <option value="01.08">01.08 - Web Design / Manutenção Sites</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Valor do Serviço (R$) *</label>
                        <input
                            type="text"
                            className="input"
                            required
                            placeholder="R$ 0,00"
                            value={formData.value}
                            onChange={e => setFormData({ ...formData, value: e.target.value })}
                        />
                        <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>ex: 150.00</small>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Discriminação *</label>
                        <textarea
                            className="input"
                            rows={3}
                            required
                            placeholder="Descrição detalhada..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                        {loading ? '⏳ Processando...' : '🚀 Emitir NFS-e'}
                    </button>
                </form>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
