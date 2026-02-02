'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getServices } from '@/app/actions/services';

export default function NovaCobrancaPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clientId: '',
        serviceId: '',
        description: '',
        value: '',
        dueDate: '',
        notes: ''
    });

    useEffect(() => {
        loadClients();
        loadServices();
    }, []);

    const loadClients = async () => {
        try {
            const res = await fetch('/api/clients');
            const data = await res.json();
            setClients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    const loadServices = async () => {
        try {
            const data = await getServices();
            setServices(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading services:', error);
            setServices([]);
        }
    };

    const handleSelectClient = (clientId: string) => {
        setFormData(prev => ({ ...prev, clientId }));
    };

    const handleSelectService = (serviceId: string) => {
        const service = services.find(s => s.id === serviceId);
        if (service) {
            setFormData(prev => ({
                ...prev,
                serviceId,
                description: service.description || service.name,
                value: service.value.toString()
            }));
        } else {
            setFormData(prev => ({ ...prev, serviceId: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/charges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const charge = await res.json();
                alert('Cobrança criada com sucesso!');
                router.push(`/admin/financeiro/cobranca/${charge.id}`);
            } else {
                const error = await res.json();
                alert('Erro: ' + error.error);
            }
        } catch (error) {
            alert('Erro ao criar cobrança');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => router.back()} className="btn" style={{ marginBottom: '1rem' }}>
                    ← Voltar
                </button>
                <h1 style={{ fontSize: '1.75rem' }}>Nova Cobrança</h1>
            </div>

            <div className="card">
                <form onSubmit={handleSubmit}>
                    {/* Client Selection */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Cliente *</label>
                        <select
                            className="input"
                            required
                            value={formData.clientId}
                            onChange={e => handleSelectClient(e.target.value)}
                        >
                            <option value="">-- Selecione o cliente --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.cpfCnpj})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Service Selection (Optional) */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Serviço (Opcional)</label>
                        <select
                            className="input"
                            value={formData.serviceId}
                            onChange={e => handleSelectService(e.target.value)}
                        >
                            <option value="">-- Nenhum serviço --</option>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name} - R$ {s.value.toFixed(2)}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>
                            Selecionar um serviço preenche automaticamente descrição e valor
                        </small>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Descrição *</label>
                        <textarea
                            className="input"
                            rows={4}
                            required
                            placeholder="Descreva o que está sendo cobrado..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Value and Due Date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label className="label">Valor (R$) *</label>
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
                        <div>
                            <label className="label">Vencimento *</label>
                            <input
                                type="date"
                                className="input"
                                required
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Observações</label>
                        <textarea
                            className="input"
                            rows={3}
                            placeholder="Informações adicionais..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                    >
                        {loading ? '⏳ Criando...' : '💰 Criar Cobrança'}
                    </button>
                </form>
            </div>

            {/* Info Box */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#eff6ff',
                color: '#1e3a8a', // Dark blue for contrast
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                border: '1px solid #bfdbfe'
            }}>
                <strong style={{ color: '#172554' }}>ℹ️ Após criar a cobrança:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', color: '#1e40af' }}>
                    <li>Você será redirecionado para a página de pagamento</li>
                    <li>Um QR Code PIX será gerado automaticamente</li>
                    <li>Você poderá gerar o PDF da cobrança</li>
                    <li>Ao marcar como pago, um recibo será gerado automaticamente</li>
                </ul>
            </div>
        </div>
    );
}
