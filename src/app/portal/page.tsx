'use client';

import { getNotes } from '@/app/actions/notes';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function PortalPage() {
    const sessionRes = useSession();
    const session = sessionRes?.data as any;
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.clientId) {
            loadNotes();
        }
    }, [session?.user?.clientId]);

    async function loadNotes() {
        setLoading(true);
        const data = await getNotes(session.user.clientId);
        setNotes(data);
        setLoading(false);
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Minhas Notas Fiscais</h1>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Últimas Emissões</span>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Carregando notas...</div>
                    ) : notes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
                            Nenhuma nota fiscal emitida até o momento.
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div key={note.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>NFS-e #{note.numero}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
                                        Emissão: {new Date(note.emissionDate).toLocaleDateString()}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>
                                        {note.description?.substring(0, 100)}...
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>
                                            R$ {note.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            background: note.status === 'AUTORIZADA' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                            color: note.status === 'AUTORIZADA' ? '#10b981' : '#ef4444',
                                            padding: '2px 8px', borderRadius: '1rem'
                                        }}>
                                            {note.status}
                                        </span>
                                    </div>
                                    {note.status === 'AUTORIZADA' && (
                                        <a
                                            href={`/api/notas/${note.id}/pdf`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary"
                                            style={{ padding: '4px 12px', fontSize: '0.8rem', height: 'auto' }}
                                        >
                                            📥 Baixar PDF
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
