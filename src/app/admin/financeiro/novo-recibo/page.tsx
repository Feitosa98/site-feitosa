'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NovoReciboPage() {
    const router = useRouter();
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clientId: '',
        value: '',
        description: '',
        paymentType: 'PIX',
        paymentDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadClients();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/receipts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const receipt = await res.json();
                alert(`Recibo #${receipt.numero} gerado com sucesso!`);
                window.open(`/api/receipts/${receipt.id}/pdf`, '_blank');
                router.push('/admin/financeiro/recibos');
            } else {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const error = await res.json();
                    alert('Erro: ' + error.error);
                } else {
                    const text = await res.text();
                    console.error('API Error Body:', text);
                    alert(`Erro no servidor: ${res.status} ${res.statusText}\nVerifique o console para mais detalhes.`);
                }
            }
        } catch (error) {
            console.error('Network/Client Error:', error);
            alert('Erro de conexão ou erro inesperado. Verifique se o servidor está rodando.');
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
                <h1 style={{ fontSize: '1.75rem' }}>Novo Recibo Avulso</h1>
                <p style={{ color: 'var(--secondary)', marginTop: '0.5rem' }}>
                    Gere um recibo independente com numeração sequencial automática
                </p>
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
                            onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                        >
                            <option value="">-- Selecione o cliente --</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.cpfCnpj})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Value and Payment Date */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label className="label">Valor Recebido (R$) *</label>
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
                            <label className="label">Data do Pagamento *</label>
                            <input
                                type="date"
                                className="input"
                                required
                                value={formData.paymentDate}
                                onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Payment Type */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Forma de Pagamento *</label>
                        <select
                            className="input"
                            required
                            value={formData.paymentType}
                            onChange={e => setFormData({ ...formData, paymentType: e.target.value })}
                        >
                            <option value="PIX">PIX</option>
                            <option value="DINHEIRO">Dinheiro</option>
                            <option value="TRANSFERENCIA">Transferência Bancária</option>
                            <option value="CARTAO">Cartão de Crédito/Débito</option>
                            <option value="BOLETO">Boleto Bancário</option>
                            <option value="CHEQUE">Cheque</option>
                        </select>
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="label">Referente a (Descrição) *</label>
                        <textarea
                            className="input"
                            rows={5}
                            required
                            placeholder="Descreva detalhadamente o que foi pago..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                        <small style={{ color: 'var(--secondary)', fontSize: '0.75rem' }}>
                            Esta descrição aparecerá no recibo como "Referente a:"
                        </small>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                    >
                        {loading ? '⏳ Gerando...' : '🧾 Gerar Recibo'}
                    </button>
                </form>
            </div>

            {/* Info Box */}
            <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: '#eff6ff',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
            }}>
                <strong>ℹ️ Numeração Sequencial:</strong>
                <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    <li>O número do recibo é gerado automaticamente</li>
                    <li>Segue a mesma sequência de todos os recibos do sistema</li>
                    <li>Formato: #000001, #000002, #000003...</li>
                    <li>O PDF será aberto automaticamente após a geração</li>
                </ul>
            </div>
        </div>
    );
}
