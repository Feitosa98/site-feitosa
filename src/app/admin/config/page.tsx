
'use client';

import { getSettings, saveSettings, testCertificate } from '@/app/actions/settings';
import { useEffect, useState } from 'react';

export default function ConfigPage() {
    const [settings, setSettings] = useState<any>(null);
    const [message, setMessage] = useState('');
    const [testStatus, setTestStatus] = useState<{ success: boolean, message: string } | null>(null);
    const [loadingTest, setLoadingTest] = useState(false);

    useEffect(() => {
        getSettings().then(setSettings);
    }, []);

    if (!settings) return <div>Carregando...</div>;

    const handleSubmit = async (formData: FormData) => {
        setTestStatus(null);
        const res = await saveSettings(formData);
        setMessage(res.message);

        // Auto-test after save if certificate is present
        if (formData.get('certificateFile') || (settings.certificatePath && formData.get('certificatePassword'))) {
            handleTest();
        } else {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleTest = async () => {
        setLoadingTest(true);
        setTestStatus(null);

        // Wait a bit to allow file save propagation if immediately after save
        await new Promise(r => setTimeout(r, 1000));

        const res = await testCertificate();
        setTestStatus(res);
        setLoadingTest(false);
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Configurações do Sistema</h1>

            {message && (
                <div style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    {message}
                </div>
            )}

            {testStatus && (
                <div style={{
                    padding: '1rem',
                    background: testStatus.success ? '#dcfce7' : '#fee2e2',
                    color: testStatus.success ? '#166534' : '#991b1b',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    border: `1px solid ${testStatus.success ? '#166534' : '#991b1b'}`
                }}>
                    <strong>{testStatus.success ? 'Sucesso:' : 'Erro:'}</strong> {testStatus.message}
                </div>
            )}

            <form action={handleSubmit} className="card">

                <section style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Ambiente NFS-e</h2>
                    <div className="label" style={{ marginBottom: '0.5rem' }}>Selecione o ambiente de emissão:</div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="radio"
                                name="environment"
                                value="homologacao"
                                defaultChecked={settings.environment === 'homologacao'}
                            />
                            Homologação (Teste)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="radio"
                                name="environment"
                                value="producao"
                                defaultChecked={settings.environment === 'producao'}
                            />
                            Produção
                        </label>
                    </div>
                </section>

                <section style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Certificado Digital (A1)</h2>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Arquivo .pfx</label>
                        <input type="file" name="certificateFile" accept=".pfx" className="input" />
                        {settings.certificatePath && (
                            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
                                ✓ Certificado atual: ...{settings.certificatePath.split(/\/|\\/).pop()}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="label">Senha do Certificado</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <input
                                name="certificatePassword"
                                type="password"
                                className="input"
                                defaultValue={settings.certificatePassword}
                                placeholder="Digite a senha do certificado..."
                                style={{ flex: 1 }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={loadingTest}
                            className="btn"
                            style={{
                                background: 'var(--card-bg)',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                opacity: loadingTest ? 0.7 : 1
                            }}
                        >
                            {loadingTest ? 'Validando...' : '🔍 Testar Certificado'}
                        </button>
                    </div>
                </section>

                <section style={{ marginBottom: '2rem', paddingBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Notificações</h2>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                name="emailEnabled"
                                defaultChecked={settings.emailEnabled}
                            />
                            Ativar Email
                        </label>
                        <input name="emailAddress" className="input" defaultValue={settings.emailAddress} placeholder="Email do remetente" style={{ marginTop: '0.5rem' }} />
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                name="whatsappEnabled"
                                defaultChecked={settings.whatsappEnabled}
                            />
                            Ativar WhatsApp
                        </label>
                        <input name="whatsappNumber" className="input" defaultValue={settings.whatsappNumber} placeholder="Número do admin" style={{ marginTop: '0.5rem' }} />
                    </div>
                </section>

                <section style={{ marginBottom: '2rem', paddingBottom: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--primary)' }}>Sincronização de Dados</h2>
                    <p style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>
                        Importar notas emitidas e clientes cadastrados diretamente do Portal Nacional NFS-e.
                    </p>
                    <SyncButton />
                </section>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem' }}>
                    Salvar Alterações
                </button>
            </form>
        </div>
    )
}

import { syncFromPortal } from '@/app/actions/sync';

function SyncButton() {
    const [loading, setLoading] = useState(false);
    const [res, setRes] = useState<any>(null);

    const handleSync = async () => {
        setLoading(true);
        const result = await syncFromPortal();
        setRes(result);
        setLoading(false);
    };

    return (
        <div>
            <button
                type="button"
                onClick={handleSync}
                disabled={loading}
                className="btn"
                style={{ background: '#3b82f6', color: 'white', border: 'none' }}
            >
                {loading ? 'Sincronizando...' : '📥 Importar Dados do Portal'}
            </button>
            {res && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: res.success ? '#166534' : '#991b1b' }}>
                    {res.message}
                </div>
            )}
        </div>
    );
}
