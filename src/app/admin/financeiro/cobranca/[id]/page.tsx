'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { buildPixPayload } from '@/lib/pix';
import QRCode from 'qrcode';

interface Charge {
    id: string;
    description: string;
    value: number;
    dueDate: string;
    status: string;
    paymentDate: string | null;
    paymentType: string | null;
    notes: string | null;
    createdAt: string;
    client: {
        id: string;
        name: string;
        cpfCnpj: string;
        email: string | null;
        phone: string | null;
        address: string | null;
    };
    service?: {
        name: string;
        serviceCode: string;
    };
}

export default function ChargeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [charge, setCharge] = useState<Charge | null>(null);
    const [loading, setLoading] = useState(true);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [pixCopyPaste, setPixCopyPaste] = useState<string>('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadCharge();
    }, [params.id]);

    const loadCharge = async () => {
        try {
            const res = await fetch(`/api/charges/${params.id}`);
            const data = await res.json();
            setCharge(data);

            // Generate PIX QR Code
            if (data.status === 'PENDENTE' || data.status === 'VENCIDO') {
                generatePixQRCode(data);
            }
        } catch (error) {
            console.error('Error loading charge:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePixQRCode = async (chargeData: Charge) => {
        const payload = buildPixPayload({
            pixKey: '35623245000150', // CNPJ da Feitosa
            merchantName: 'FEITOSA SOLUCOES EM INFORMATICA',
            merchantCity: 'MANAUS',
            txId: chargeData.id.slice(-25),
            amount: chargeData.value.toFixed(2)
        });

        setPixCopyPaste(payload);

        // Generate QR Code
        try {
            const qrUrl = await QRCode.toDataURL(payload, {
                width: 300,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(qrUrl);
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    };

    const copyPixCode = () => {
        navigator.clipboard.writeText(pixCopyPaste);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const markAsPaid = async () => {
        if (!confirm('Confirmar pagamento desta cobrança?')) return;

        try {
            const res = await fetch(`/api/charges/${params.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentType: 'PIX' })
            });

            if (res.ok) {
                alert('Pagamento confirmado!');
                router.push('/admin/financeiro');
            } else {
                alert('Erro ao confirmar pagamento');
            }
        } catch (error) {
            alert('Erro ao processar pagamento');
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando...</div>;
    }

    if (!charge) {
        return <div style={{ padding: '2rem', textAlign: 'center' }}>Cobrança não encontrada</div>;
    }

    const isPending = charge.status === 'PENDENTE' || charge.status === 'VENCIDO';

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => router.back()} className="btn" style={{ marginBottom: '1rem' }}>
                    ← Voltar
                </button>
                <h1 style={{ fontSize: '1.75rem' }}>Detalhes da Cobrança</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isPending ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
                {/* Charge Details */}
                <div>
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Informações</h2>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Cliente</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{charge.client.name}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>{charge.client.cpfCnpj}</div>

                            {charge.client.address && (
                                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                    📍 {charge.client.address}
                                </div>
                            )}

                            {(charge.client.email || charge.client.phone) && (
                                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: 'var(--secondary)' }}>
                                    {charge.client.email} {charge.client.email && charge.client.phone && ' | '} {charge.client.phone}
                                </div>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Descrição</div>
                            <div>{charge.description}</div>
                        </div>

                        {charge.service && (
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Serviço</div>
                                <div>{charge.service.name}</div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Vencimento</div>
                                <div style={{ fontWeight: '500' }}>
                                    {new Date(charge.dueDate).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Status</div>
                                <div>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '1rem',
                                        fontSize: '0.875rem',
                                        background: charge.status === 'PAGO' ? '#d1fae5' : '#fef3c7',
                                        color: charge.status === 'PAGO' ? '#10b981' : '#f59e0b'
                                    }}>
                                        {charge.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>Valor</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                                R$ {charge.value.toFixed(2).replace('.', ',')}
                            </div>
                        </div>

                        {charge.notes && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--background)', borderRadius: '0.5rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Observações</div>
                                <div style={{ fontSize: '0.875rem' }}>{charge.notes}</div>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                            <a href={`/api/charges/${charge.id}/pdf`} target="_blank" className="btn" style={{ flex: 1 }}>
                                📄 Ver PDF
                            </a>
                            {isPending && (
                                <button onClick={markAsPaid} className="btn btn-primary" style={{ flex: 1 }}>
                                    ✓ Marcar como Pago
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* PIX Payment */}
                {isPending && (
                    <div>
                        <div className="card">
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', textAlign: 'center' }}>
                                💳 Pagar com PIX
                            </h2>

                            {qrCodeUrl && (
                                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: 'white',
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        display: 'inline-block'
                                    }}>
                                        <img src={qrCodeUrl} alt="QR Code PIX" style={{ width: '250px', height: '250px' }} />
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                                    Chave PIX (CNPJ)
                                </div>
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'var(--background)',
                                    borderRadius: '0.5rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem'
                                }}>
                                    35.623.245/0001-50
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                                    PIX Copia e Cola
                                </div>
                                <div style={{
                                    padding: '0.75rem',
                                    background: 'var(--background)',
                                    borderRadius: '0.5rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.75rem',
                                    wordBreak: 'break-all',
                                    maxHeight: '100px',
                                    overflowY: 'auto'
                                }}>
                                    {pixCopyPaste}
                                </div>
                            </div>

                            <button
                                onClick={copyPixCode}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1rem' }}
                            >
                                {copied ? '✓ Copiado!' : '📋 Copiar Código PIX'}
                            </button>

                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: '#eff6ff',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem'
                            }}>
                                <strong>Como pagar:</strong>
                                <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                                    <li>Abra o app do seu banco</li>
                                    <li>Escolha pagar com PIX</li>
                                    <li>Escaneie o QR Code ou cole o código</li>
                                    <li>Confirme o pagamento</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
