'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        setLoading(true);
        const data = await getSettings();
        setSettings(data);
        setLoading(false);
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        const res = await updateSettings(settings); // Send the entire settings object

        if (res.success) {
            setMessage('Configurações salvas com sucesso!');
        } else {
            setMessage('Erro ao salvar configurações.');
        }
        setSaving(false);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setSettings((prev: any) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    if (loading) return <div>Carregando configurações...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Configurações do Sistema</h1>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    borderRadius: '8px',
                    background: message.includes('sucesso') ? '#d1fae5' : '#fee2e2',
                    color: message.includes('sucesso') ? '#065f46' : '#991b1b'
                }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Email Section */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        📧 Configuração de Email (SMTP)
                    </h2>

                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                name="emailEnabled"
                                checked={settings.emailEnabled || false}
                                onChange={handleChange}
                                style={{ width: '18px', height: '18px' }}
                            />
                            <strong>Ativar envio de emails pelo sistema</strong>
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', opacity: settings.emailEnabled ? 1 : 0.5, pointerEvents: settings.emailEnabled ? 'auto' : 'none' }}>
                        <div>
                            <label className="label">Servidor SMTP (Host)</label>
                            <input
                                name="smtpHost"
                                className="input"
                                value={settings.smtpHost || ''}
                                onChange={handleChange}
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div>
                            <label className="label">Porta</label>
                            <input
                                name="smtpPort"
                                className="input"
                                value={settings.smtpPort || ''}
                                onChange={handleChange}
                                placeholder="587"
                            />
                        </div>
                        <div>
                            <label className="label">Usuário SMTP</label>
                            <input
                                name="smtpUser"
                                className="input"
                                value={settings.smtpUser || ''}
                                onChange={handleChange}
                                placeholder="seu-email@gmail.com"
                            />
                        </div>
                        <div>
                            <label className="label">Senha SMTP (App Password)</label>
                            <input
                                name="smtpPassword"
                                type="password"
                                className="input"
                                value={settings.smtpPassword || ''}
                                onChange={handleChange}
                                placeholder="Senha de aplicativo gerada"
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label className="label">Email de Remetente (From)</label>
                            <input
                                name="smtpFrom"
                                className="input"
                                value={settings.smtpFrom || ''}
                                onChange={handleChange}
                                placeholder='"Nome da Empresa" <email@empresa.com>'
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Se vazio, o sistema usará o "Usuário SMTP" como remetente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Other Settings */}
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                        📜 Certificado Digital (NFS-e)
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label className="label">Ambiente de Emissão</label>
                            <select
                                name="environment"
                                className="input"
                                value={settings.environment || 'homologacao'}
                                onChange={handleChange}
                            >
                                <option value="homologacao">Homologação (Produção Restrita)</option>
                                <option value="producao">Produção</option>
                            </select>
                            <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>
                                Homologação é para testes. Produção tem valor fiscal.
                            </p>
                        </div>

                        <div></div> {/* Spacer */}

                        <div>
                            <label className="label">Arquivo do Certificado (.pfx)</label>
                            <input
                                type="file"
                                accept=".pfx"
                                className="input"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            const base64 = reader.result?.toString().split(',')[1];
                                            setSettings((prev: any) => ({ ...prev, certificateFile: base64, certificateFileName: file.name }));
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            {settings.certificatePath && (
                                <p style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem' }}>
                                    ✅ Certificado atual configurado
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="label">Senha do Certificado</label>
                            <input
                                name="certificatePassword"
                                type="password"
                                className="input"
                                value={settings.certificatePassword || ''}
                                onChange={handleChange}
                                placeholder="Senha do arquivo .pfx"
                            />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ padding: '1rem 3rem', fontSize: '1.1rem' }}
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
