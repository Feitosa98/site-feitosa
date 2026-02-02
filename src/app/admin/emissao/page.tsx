
'use client';

import { getClients } from '@/app/actions/clients';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmissaoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [emittedNote, setEmittedNote] = useState<any>(null);
    const [clients, setClients] = useState<any[]>([]);
    const [sendingEmail, setSendingEmail] = useState(false);

    // Load clients for selection
    useEffect(() => {
        getClients().then(setClients);
    }, []);

    const [formData, setFormData] = useState({
        clientName: '',
        clientCpfCnpj: '',
        clientEmail: '',
        serviceCode: '01.07', // Default: Suporte Técnico
        value: '',
        description: ''
    });

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
                clientId: client.id
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setEmittedNote(null);

        try {
            const res = await fetch('/api/nfse/emit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setEmittedNote(data);
            } else {
                alert('Erro: ' + (data.error || 'Falha na emissão'));
            }
        } catch (error) {
            alert('Erro ao processar emissão.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        if (!emittedNote || !formData.clientEmail) {
            alert('Email do cliente não informado');
            return;
        }

        setSendingEmail(true);
        try {
            // TODO: Implement email sending API
            alert('Funcionalidade de envio de email será implementada em breve');
        } catch (error) {
            alert('Erro ao enviar email');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleNewEmission = () => {
        setEmittedNote(null);
        setFormData({
            clientName: '',
            clientCpfCnpj: '',
            clientEmail: '',
            serviceCode: '01.01',
            value: '',
            description: ''
        });
    };

    const handleViewPdf = () => {
        // Redirect to history page where user can view all notes and PDFs
        router.push('/admin/notas');
    };

    // Success Screen
    if (emittedNote) {
        return (
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#10b981' }}>
                        NFS-e Emitida com Sucesso!
                    </h1>
                    <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
                        {emittedNote.message || 'Nota fiscal autorizada'}
                    </p>

                    {/* Note Details */}
                    <div style={{
                        background: 'var(--background)',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        marginBottom: '2rem',
                        textAlign: 'left'
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>Número da NFS-e</small>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {emittedNote.numero}
                                </div>
                            </div>
                            <div>
                                <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>Código de Verificação</small>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                                    {emittedNote.codigoVerificacao}
                                </div>
                            </div>
                        </div>

                        {emittedNote.protocolo && (
                            <div style={{ marginBottom: '1rem' }}>
                                <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>Protocolo</small>
                                <div style={{ fontFamily: 'monospace' }}>{emittedNote.protocolo}</div>
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>Tomador</small>
                            <div>{formData.clientName}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>{formData.clientCpfCnpj}</div>
                        </div>

                        <div>
                            <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>Valor</small>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                                R$ {parseFloat(formData.value).toFixed(2)}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <button
                            onClick={handleViewPdf}
                            className="btn btn-primary"
                            style={{ padding: '1rem' }}
                        >
                            📄 Visualizar PDF
                        </button>
                        <button
                            onClick={handleSendEmail}
                            disabled={!formData.clientEmail || sendingEmail}
                            className="btn"
                            style={{
                                padding: '1rem',
                                background: formData.clientEmail ? 'var(--primary)' : 'var(--border)',
                                color: formData.clientEmail ? 'white' : 'var(--secondary)'
                            }}
                        >
                            {sendingEmail ? '📧 Enviando...' : '📧 Enviar por Email'}
                        </button>
                    </div>

                    {emittedNote.linkConsulta && (
                        <div style={{ marginBottom: '1rem' }}>
                            <a
                                href={emittedNote.linkConsulta}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn"
                                style={{ width: '100%', padding: '1rem', background: 'var(--background)' }}
                            >
                                🔗 Consultar no Portal Nacional
                            </a>
                        </div>
                    )}

                    <button
                        onClick={handleNewEmission}
                        className="btn"
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        ➕ Emitir Nova NFS-e
                    </button>

                    {!formData.clientEmail && (
                        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#f59e0b' }}>
                            ⚠️ Email do cliente não informado. Não será possível enviar por email.
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Emission Form
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

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label className="label">Nome/Razão Social do Tomador *</label>
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

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Email do Cliente</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="email@cliente.com"
                            value={formData.clientEmail}
                            onChange={e => setFormData({ ...formData, clientEmail: e.target.value })}
                        />
                        <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>
                            Opcional - necessário para envio automático por email
                        </small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Código do Serviço (LC 116) *</label>
                        <input
                            type="text"
                            className="input"
                            required
                            placeholder="Ex: 01.07"
                            list="service-codes"
                            value={formData.serviceCode}
                            onChange={e => setFormData({ ...formData, serviceCode: e.target.value })}
                        />
                        <datalist id="service-codes">
                            <option value="01.01">01.01 - Análise e Desenvolvimento de Sistemas</option>
                            <option value="01.02">01.02 - Programação</option>
                            <option value="01.03">01.03 - Processamento de Dados</option>
                            <option value="01.04">01.04 - Processamento, Armazenamento ou Hospedagem</option>
                            <option value="01.05">01.05 - Licenciamento ou Cessão de Software</option>
                            <option value="01.06">01.06 - Assessoria e Consultoria em Informática</option>
                            <option value="01.07">01.07 - Suporte Técnico em Informática</option>
                            <option value="01.08">01.08 - Planejamento, Confecção, Manutenção de Páginas</option>
                            <option value="01.09">01.09 - Disponibilização de Conteúdo</option>
                        </datalist>
                        <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>
                            Digite ou selecione o código do serviço (padrão: 01.07)
                        </small>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Valor do Serviço (R$) *</label>
                        <input
                            type="text"
                            className="input"
                            required
                            placeholder="R$ 0,00"
                            value={formData.value ? Number(formData.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
                            onChange={e => {
                                const value = e.target.value.replace(/\D/g, '');
                                const numberValue = Number(value) / 100;
                                setFormData({ ...formData, value: numberValue.toFixed(2) });
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Discriminação do Serviço *</label>
                        <textarea
                            className="input"
                            rows={4}
                            required
                            placeholder="Descreva detalhadamente o serviço prestado..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                        {loading ? '⏳ Transmitindo para Homologação...' : '🚀 Emitir NFS-e (Homologação)'}
                    </button>
                </form>
            </div>
        </div>
    );
}
