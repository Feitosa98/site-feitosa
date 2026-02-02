'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ValidationResult {
    valid: boolean;
    signaturePresent: boolean;
    signerInfo?: {
        commonName?: string;
        organization?: string;
        country?: string;
    };
    signatureDate?: string;
    errors?: string[];
}

export default function ValidadorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [validating, setValidating] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
        }
    };

    const handleValidate = async () => {
        if (!file) return;

        setValidating(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('pdf', file);

            const response = await fetch('/api/validate-pdf', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Erro ao validar PDF');
            }

            const data = await response.json();
            setResult(data);
        } catch (error: any) {
            setResult({
                valid: false,
                signaturePresent: false,
                errors: [error.message || 'Erro desconhecido ao validar']
            });
        } finally {
            setValidating(false);
        }
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Validador de Recibos</h1>
                    <p className="text-muted">Valide assinaturas digitais ICP-Brasil em PDFs</p>
                </div>
                <Link href="/admin" className="btn-outline" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    Voltar
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '800px' }}>

                {/* Upload Section */}
                <div className="card">
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        Enviar PDF para Validação
                    </h2>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label className="label">Selecione um arquivo PDF</label>
                            <input
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileChange}
                                className="input"
                                style={{ cursor: 'pointer' }}
                            />
                            {file && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Arquivo selecionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleValidate}
                            disabled={!file || validating}
                            className="btn btn-primary"
                            style={{ height: '45px', minWidth: '140px' }}
                        >
                            {validating ? (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
                                    Validando...
                                </span>
                            ) : (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Validar PDF
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Result Section */}
                {result && (
                    <div className={`card ${result.valid ? 'card-hover' : ''}`} style={{
                        border: result.valid ? '2px solid #10b981' : '2px solid #ef4444',
                        background: result.valid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                    }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{
                                padding: '12px',
                                background: result.valid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px',
                                color: result.valid ? '#10b981' : '#ef4444'
                            }}>
                                {result.valid ? (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                ) : (
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: result.valid ? '#10b981' : '#ef4444' }}>
                                    {result.valid ? 'Assinatura Válida' : 'Assinatura Inválida'}
                                </h3>

                                {result.signaturePresent ? (
                                    <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                                        <p style={{ marginBottom: '0.75rem' }}>
                                            O documento possui assinatura digital ICP-Brasil.
                                        </p>

                                        {result.signerInfo && (
                                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', marginTop: '1rem' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                                                    INFORMAÇÕES DO SIGNATÁRIO
                                                </div>
                                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                    {result.signerInfo.commonName && (
                                                        <div><strong>Nome:</strong> {result.signerInfo.commonName}</div>
                                                    )}
                                                    {result.signerInfo.organization && (
                                                        <div><strong>Organização:</strong> {result.signerInfo.organization}</div>
                                                    )}
                                                    {result.signerInfo.country && (
                                                        <div><strong>País:</strong> {result.signerInfo.country}</div>
                                                    )}
                                                    {result.signatureDate && (
                                                        <div><strong>Data da Assinatura:</strong> {new Date(result.signatureDate).toLocaleString('pt-BR')}</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {result.valid && (
                                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', fontSize: '0.85rem' }}>
                                                ✓ A assinatura está íntegra e o documento não foi alterado após a assinatura.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '0.9rem' }}>
                                        O documento não possui assinatura digital ou a assinatura não pôde ser verificada.
                                    </p>
                                )}

                                {result.errors && result.errors.length > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#ef4444' }}>
                                            ERROS ENCONTRADOS:
                                        </div>
                                        <ul style={{ fontSize: '0.85rem', paddingLeft: '1.5rem', margin: 0 }}>
                                            {result.errors.map((err, idx) => (
                                                <li key={idx} style={{ marginBottom: '0.25rem' }}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
