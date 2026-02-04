'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAssets } from '@/app/actions/assets';

export default function InventoryPage() {
    const { data: session } = useSession();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.clientId) { // Access clientId from session user
            loadAssets((session.user as any).clientId);
        }
    }, [session]);

    async function loadAssets(clientId: string) {
        setLoading(true);
        try {
            const data = await getAssets(clientId);
            setAssets(data);
        } catch (error) {
            console.error('Erro ao carregar inventário:', error);
        } finally {
            setLoading(false);
        }
    }

    const totalValue = assets.reduce((acc, asset) => acc + (asset.value || 0), 0);

    return (
        <div className="inventory-container">
            <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Meu Inventário</h1>
                <button
                    onClick={() => window.print()}
                    className="btn btn-primary no-print"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    🖨️ Imprimir Relatório
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando ativos...</div>
            ) : assets.length === 0 ? (
                <div className="empty-state">
                    <p>Nenhum item cadastrado no seu inventário.</p>
                </div>
            ) : (
                <>
                    <div className="report-header only-print" style={{ display: 'none', marginBottom: '2rem' }}>
                        <h2>Relatório de Inventário</h2>
                        <p>Cliente: {session?.user?.name}</p>
                        <p>Data: {new Date().toLocaleDateString()}</p>
                        <hr />
                    </div>

                    <div className="table-responsive">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--card-bg)', borderBottom: '2px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Nome/Descrição</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Código</th>
                                    <th style={{ padding: '1rem', textAlign: 'left' }}>Data Compra</th>
                                    <th style={{ padding: '1rem', textAlign: 'right' }}>Valor</th>
                                    <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map((asset) => (
                                    <tr key={asset.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{asset.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{asset.description}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{asset.code || '-'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {asset.value ? `R$ ${asset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                background: asset.status === 'ATIVO' ? '#d1fae5' : '#f3f4f6',
                                                color: asset.status === 'ATIVO' ? '#065f46' : '#374151'
                                            }}>
                                                {asset.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{ background: 'var(--card-bg)', fontWeight: 'bold' }}>
                                    <td colSpan={3} style={{ padding: '1rem', textAlign: 'right' }}>Total Estimado:</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </>
            )}

            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    .only-print {
                        display: block !important;
                    }
                    body {
                        background: white;
                        color: black;
                    }
                    nav, aside, header {
                        display: none !important;
                    }
                    .inventory-container {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
}
