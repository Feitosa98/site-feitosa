
'use client';

import { addClient, getClients, deleteClient } from '@/app/actions/clients';
import { useState, useEffect } from 'react';

export default function ClientsPage() {
    const [clients, setClients] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        cpfCnpj: '',
        email: '',
        phone: '',
        cep: '',
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: ''
    });
    const [searching, setSearching] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [loadingCnpj, setLoadingCnpj] = useState(false);

    useEffect(() => {
        getClients().then(setClients);
    }, []);

    // Auto-fill CEP
    const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, cep: value }));

        if (value.length === 8) {
            setLoadingCep(true);
            try {
                const response = await fetch(`https://viacep.com.br/ws/${value}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        street: data.logradouro || '',
                        neighborhood: data.bairro || '',
                        city: data.localidade || '',
                        state: data.uf || ''
                    }));
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            } finally {
                setLoadingCep(false);
            }
        }
    };

    // Auto-fill when CPF/CNPJ is typed
    const handleCpfCnpjChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, cpfCnpj: value }));

        const digitsOnly = value.replace(/\D/g, '');

        // Check if client already exists locally
        if (digitsOnly.length === 11 || digitsOnly.length === 14) {
            const existing = clients.find(c => c.cpfCnpj.replace(/\D/g, '') === digitsOnly);
            if (existing) {
                setSearching(true);
                // Parse existing address
                const addressParts = existing.address?.split(',') || [];
                setFormData({
                    name: existing.name,
                    cpfCnpj: existing.cpfCnpj,
                    email: existing.email || '',
                    phone: existing.phone || '',
                    cep: existing.cep || '',
                    street: addressParts[0]?.trim() || '',
                    number: addressParts[1]?.trim() || '',
                    neighborhood: addressParts[2]?.trim() || '',
                    city: addressParts[3]?.split('-')[0]?.trim() || '',
                    state: addressParts[3]?.split('-')[1]?.trim() || ''
                });
                setTimeout(() => setSearching(false), 500);
                return;
            }
        }

        // If CNPJ (14 digits), consult BrasilAPI
        if (digitsOnly.length === 14) {
            setLoadingCnpj(true);
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digitsOnly}`);
                const data = await response.json();

                if (data.razao_social) {
                    setFormData(prev => ({
                        ...prev,
                        name: data.razao_social || data.nome_fantasia || '',
                        email: data.email || '',
                        phone: data.ddd_telefone_1 || '',
                        cep: data.cep?.replace(/\D/g, '') || '',
                        street: data.logradouro || '',
                        number: data.numero || '',
                        neighborhood: data.bairro || '',
                        city: data.municipio || '',
                        state: data.uf || ''
                    }));
                    setSearching(true);
                    setTimeout(() => setSearching(false), 1000);
                }
            } catch (error) {
                console.error('Erro ao buscar CNPJ:', error);
            } finally {
                setLoadingCnpj(false);
            }
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = new FormData();
        form.append('name', formData.name);
        form.append('cpfCnpj', formData.cpfCnpj);
        form.append('email', formData.email);
        form.append('phone', formData.phone);

        // Combine address fields
        const fullAddress = `${formData.street}, ${formData.number}, ${formData.neighborhood}, ${formData.city} - ${formData.state}`;
        form.append('address', fullAddress);

        await addClient(form);
        setShowForm(false);
        setFormData({ name: '', cpfCnpj: '', email: '', phone: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: '' });
        const updated = await getClients();
        setClients(updated);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza?')) return;
        await deleteClient(id);
        setClients(clients.filter(c => c.id !== id));
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>Gerenciar Clientes</h1>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                    {showForm ? 'Cancelar' : '+ Novo Cliente'}
                </button>
            </div>

            {showForm && (
                <div className="card" style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s', position: 'relative', zIndex: 100 }}>
                    <form onSubmit={handleAdd}>
                        {/* CPF/CNPJ and Name */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="label">CPF / CNPJ *</label>
                                <input
                                    name="cpfCnpj"
                                    className="input"
                                    value={formData.cpfCnpj}
                                    onChange={handleCpfCnpjChange}
                                    placeholder="Digite o CPF ou CNPJ"
                                    required
                                />
                                {loadingCnpj && <small style={{ color: 'var(--primary)' }}>🔍 Consultando CNPJ...</small>}
                                {searching && <small style={{ color: '#10b981' }}>✓ Dados encontrados!</small>}
                            </div>
                            <div>
                                <label className="label">Nome / Razão Social *</label>
                                <input
                                    name="name"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        {/* Email and Phone */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="label">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    className="input"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                            <div>
                                <label className="label">Telefone / WhatsApp</label>
                                <input
                                    name="phone"
                                    className="input"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div style={{ marginBottom: '0.5rem', marginTop: '1.5rem' }}>
                            <strong style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>📍 Endereço</strong>
                        </div>

                        {/* CEP */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">CEP</label>
                            <input
                                name="cep"
                                className="input"
                                value={formData.cep}
                                onChange={handleCepChange}
                                placeholder="00000-000"
                                maxLength={8}
                                style={{ maxWidth: '200px' }}
                            />
                            {loadingCep && <small style={{ color: 'var(--primary)', marginLeft: '0.5rem' }}>🔍 Buscando endereço...</small>}
                        </div>

                        {/* Street and Number */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="label">Logradouro</label>
                                <input
                                    name="street"
                                    className="input"
                                    value={formData.street}
                                    onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                                    placeholder="Rua, Avenida, etc."
                                />
                            </div>
                            <div>
                                <label className="label">Número</label>
                                <input
                                    name="number"
                                    className="input"
                                    value={formData.number}
                                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                                    placeholder="123"
                                />
                            </div>
                        </div>

                        {/* Neighborhood, City and State */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label className="label">Bairro</label>
                                <input
                                    name="neighborhood"
                                    className="input"
                                    value={formData.neighborhood}
                                    onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                                    placeholder="Centro"
                                />
                            </div>
                            <div>
                                <label className="label">Cidade</label>
                                <input
                                    name="city"
                                    className="input"
                                    value={formData.city}
                                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                                    placeholder="Manaus"
                                />
                            </div>
                            <div>
                                <label className="label">UF</label>
                                <input
                                    name="state"
                                    className="input"
                                    value={formData.state}
                                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                                    placeholder="AM"
                                    maxLength={2}
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary">Salvar Cliente</button>
                    </form>
                </div>
            )}

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Nome</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>CPF/CNPJ</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    Nenhum cliente cadastrado.
                                </td>
                            </tr>
                        )}
                        {clients.map(client => (
                            <tr key={client.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>{client.name}</td>
                                <td style={{ padding: '1rem' }}>{client.cpfCnpj}</td>
                                <td style={{ padding: '1rem' }}>{client.email || '-'}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        style={{ color: '#ef4444', background: 'none', border: 'none', marginLeft: '1rem' }}
                                    >
                                        Excluir
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
