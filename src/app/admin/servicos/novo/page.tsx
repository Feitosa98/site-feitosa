'use client';

import { saveService, getService } from '@/app/actions/services';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';

// Inner component that uses useSearchParams
function ServiceFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [loading, setLoading] = useState(false);
    const [service, setService] = useState<any>(null);

    useEffect(() => {
        if (id) {
            getService(id).then(setService);
        }
    }, [id]);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        if (id) {
            formData.append('id', id);
        }

        const res = await saveService(formData);

        if (res.success) {
            toast.success('Serviço salvo com sucesso!');
            router.push('/admin/servicos');
            router.refresh(); // Refresh server components
        } else {
            toast.error(res.message || 'Erro ao salvar serviço');
            setLoading(false);
        }
    }

    if (id && !service) {
        return <div className="p-8 text-center text-muted">Carregando...</div>;
    }

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <Link href="/admin/servicos" className="btn btn-ghost">
                    ← Voltar
                </Link>
                <h1 style={{ fontSize: '1.75rem' }}>{id ? 'Editar Serviço' : 'Novo Serviço'}</h1>
            </div>

            <div className="card">
                <form action={handleSubmit}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>

                        {/* Nome do Serviço */}
                        <div>
                            <label className="label">Nome do Serviço</label>
                            <input
                                name="name"
                                defaultValue={service?.name}
                                className="input"
                                placeholder="Ex: Consultoria Técnica"
                                required
                            />
                        </div>

                        {/* Descrição */}
                        <div>
                            <label className="label">Descrição Detalhada</label>
                            <textarea
                                name="description"
                                defaultValue={service?.description}
                                className="input"
                                rows={4}
                                placeholder="Descrição que aparecerá na nota fiscal..."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* Valor */}
                            <div>
                                <label className="label">Valor Padrão (R$)</label>
                                <input
                                    name="value"
                                    defaultValue={service?.value?.toFixed(2)}
                                    className="input"
                                    placeholder="0,00"
                                    step="0.01"
                                    required
                                />
                            </div>

                            {/* Código LC 116 */}
                            <div>
                                <label className="label">Código LC 116</label>
                                <input
                                    name="serviceCode"
                                    defaultValue={service?.serviceCode}
                                    className="input"
                                    placeholder="Ex: 01.01"
                                />
                                <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                    Código de serviço da Lista Complementar 116
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <Link href="/admin/servicos" className="btn btn-ghost">
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Salvar Serviço'}
                            </button>
                        </div>

                    </div>
                </form>
            </div>
        </div>
    );
}

// Default export with Suspense wrapper for Next.js prerendering compatibility
export default function NewServicePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Carregando...</div>}>
            <ServiceFormContent />
        </Suspense>
    );
}
