import { getServices, deleteService } from '@/app/actions/services';
import Link from 'next/link';

// Force dynamic rendering to avoid database calls during build
export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
    const services = await getServices();

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem' }}>Gestão de Serviços</h1>
                <Link href="/admin/servicos/novo" className="btn btn-primary">
                    ➕ Novo Serviço
                </Link>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Serviço</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Código LC 116</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Valor Padrão</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary)' }}>
                                    Nenhum serviço cadastrado.
                                </td>
                            </tr>
                        )}
                        {services.map((service: any) => (
                            <tr key={service.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '500' }}>{service.name}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
                                        {service.description?.substring(0, 50)}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {service.serviceCode || '-'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                                    R$ {service.value.toFixed(2).replace('.', ',')}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <Link
                                            href={`/admin/servicos/novo?id=${service.id}`}
                                            className="btn"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                        >
                                            ✏️ Editar
                                        </Link>
                                        <form action={async () => {
                                            'use server';
                                            await deleteService(service.id);
                                        }}>
                                            <button
                                                type="submit"
                                                className="btn"
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.875rem',
                                                    background: '#fee2e2',
                                                    color: '#991b1b',
                                                    border: 'none'
                                                }}
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
