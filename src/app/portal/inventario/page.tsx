'use client';

import { getAssets } from '@/app/actions/assets';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export const dynamic = 'force-dynamic';

export default function ClientInventoryPage() {
    const sessionRes = useSession();
    const session = sessionRes?.data as any;
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.clientId) {
            loadAssets();
        }
    }, [session?.user?.clientId]);

    async function loadAssets() {
        setLoading(true);
        const data = await getAssets(session.user.clientId);
        setAssets(data);
        setLoading(false);
    }

    if (!session?.user?.clientId) {
        return <div className="p-8">Acesso restrito.</div>;
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>📋 Meu Inventário</h1>
            <p style={{ color: 'var(--secondary)', marginBottom: '2rem' }}>
                Abaixo estão listados os ativos e equipamentos vinculados à sua conta.
            </p>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>Carregando inventário...</div>
                ) : assets.length === 0 ? (
                    <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                        <h3>Nenhum item encontrado</h3>
                        <p style={{ opacity: 0.6 }}>Você ainda não possui ativos registrados em nosso sistema.</p>
                    </div>
                ) : (
                    assets.map(asset => (
                        <div key={asset.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <h3 style={{ margin: 0 }}>{asset.name}</h3>
                                <span style={{
                                    padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold',
                                    backgroundColor: asset.status === 'ATIVO' ? 'rgba(16, 185, 129, 0.1)' : asset.status === 'MANUTENCAO' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: asset.status === 'ATIVO' ? '#10b981' : asset.status === 'MANUTENCAO' ? '#f59e0b' : '#ef4444'
                                }}>
                                    {asset.status}
                                </span>
                            </div>

                            {asset.code && (
                                <div style={{ fontSize: '0.85rem' }}>
                                    <span style={{ opacity: 0.6 }}>Série/Código: </span>
                                    <code style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '4px' }}>{asset.code}</code>
                                </div>
                            )}

                            <p style={{ fontSize: '0.9rem', opacity: 0.8, flex: 1 }}>
                                {asset.description || 'Sem descrição detalhada.'}
                            </p>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span>Adquirido em: {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</span>
                                {asset.value > 0 && (
                                    <span style={{ fontWeight: 'bold' }}>R$ {asset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
