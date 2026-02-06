import { getServices, deleteService } from '@/app/actions/services';
import Link from 'next/link';

// Force dynamic rendering to avoid database calls during build
export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
    const services = await getServices();

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>Gestão de Serviços</h1>
                <Link href="/admin/servicos/novo" className="btn btn-primary">
                    ➕ Novo Serviço
                </Link>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--secondary)' }}>Serviço</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--secondary)' }}>Código LC 116</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--secondary)' }}>Valor Padrão</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: 'var(--secondary)' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Nenhum serviço encontrado</div>
                                    <div style={{ fontSize: '0.9rem' }}>Comece cadastrando um novo serviço acima.</div>
                                </td>
                            </tr>
                        )}
                        {services.map((service: any) => (
                            <tr key={service.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500', color: 'var(--foreground)' }}>{service.name}</div>
                                    {service.description && (
                                        <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>
                                            {service.description.substring(0, 60)}{service.description.length > 60 ? '...' : ''}
                                        </div>
                                    )}
                                </td>
                                <td style={{ padding: '1rem', color: 'var(--secondary)' }}>
                                    {service.serviceCode || '-'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: 'var(--primary)' }}>
                                    {service.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link
                                            href={`/admin/servicos/novo?id=${service.id}`}
                                            className="btn btn-outline"
                                            style={{ padding: '0.5rem', height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Editar"
                                        >
                                            ✏️
                                        </Link>
                                        <form action={async () => {
                                            'use server';
                                            await deleteService(service.id);
                                        }}>
                                            <button
                                                type="submit"
                                                className="btn"
                                                style={{
                                                    padding: '0.5rem',
                                                    height: '36px',
                                                    width: '36px',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                title="Excluir"
                                            >
                                                🗑️
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
