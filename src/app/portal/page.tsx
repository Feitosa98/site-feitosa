
export default function PortalPage() {
    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Minhas Notas Fiscais</h1>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Últimas Emissões</span>
                    <button style={{ fontSize: '0.875rem', color: 'var(--primary)', background: 'none', border: 'none' }}>Ver todas</button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Placeholder List */}
                    {[1, 2, 3].map((i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>NFS-e #{2024000 + i}</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Emissão: 02/02/2026</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold' }}>R$ 1.500,00</div>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '2px 8px', borderRadius: '1rem' }}>Autorizada</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
