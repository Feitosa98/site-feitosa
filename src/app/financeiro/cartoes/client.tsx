'use client';

import { useState } from 'react';
import { createCard, deleteCard } from '@/app/actions/finance-cards';
import { toast } from 'sonner';
import Link from 'next/link';

function SubmitButton() {
    return (
        <button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition">
            Salvar Cartão
        </button>
    );
}

export default function CreditCardsClient({ cards = [], userId }: { cards: any[], userId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<any>(null);

    async function handleDelete(cardId: string, cardName: string) {
        if (confirm(`Tem certeza que deseja excluir o cartão "${cardName}"?`)) {
            const res = await deleteCard(cardId);
            if (res?.success) {
                toast.success('Cartão excluído com sucesso!');
                window.location.reload();
            } else {
                toast.error('Erro ao excluir cartão');
            }
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start flex-wrap gap-4">
                    <div>
                        <Link href="/financeiro" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-3 transition">
                            <span className="mr-2">←</span> Voltar
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Meus Cartões</h1>
                        <p className="text-slate-600 mt-2">Gerencie seus limites e datas de fechamento</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingCard(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Novo Cartão
                    </button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cards.map((card) => {
                        const limit = card.limit || 0;
                        const invoice = card.currentInvoice || 0;
                        const usagePercent = limit > 0 ? Math.min((invoice / limit) * 100, 100) : 0;
                        const available = limit - invoice;

                        return (
                            <div key={card.id} className="group relative overflow-hidden rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                                {/* Card Background with Gradient */}
                                <div
                                    className="absolute inset-0 z-0"
                                    style={{
                                        background: `linear-gradient(135deg, ${card.color || '#3b82f6'} 0%, ${card.color || '#3b82f6'}dd 100%)`
                                    }}
                                />

                                {/* Glassmorphism Overlay */}
                                <div className="absolute inset-0 z-0 bg-white/10 backdrop-blur-sm" />

                                {/* Card Content */}
                                <div className="relative z-10 p-6 text-white min-h-[280px] flex flex-col justify-between">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect width="20" height="14" x="2" y="5" rx="2" />
                                                    <line x1="2" x2="22" y1="10" y2="10" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold drop-shadow-lg">{card.name}</h3>
                                                <p className="text-white/80 text-sm font-mono">**** **** **** ****</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/20 px-4 py-2 rounded-full backdrop-blur-md">
                                            <p className="text-[10px] uppercase opacity-90 font-bold tracking-wider">Fecha dia</p>
                                            <p className="font-mono text-xl font-bold text-center">{card.closingDay}</p>
                                        </div>
                                    </div>

                                    {/* Values */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs opacity-90 mb-1 font-semibold uppercase tracking-wide">Fatura Atual</p>
                                                <p className="text-3xl font-black tracking-tight drop-shadow-lg">
                                                    R$ {invoice.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs opacity-90 mb-1 font-semibold uppercase tracking-wide">Disponível</p>
                                                <p className="text-lg font-bold">R$ {available.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-md">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-400' : usagePercent > 70 ? 'bg-yellow-400' : 'bg-white'}`}
                                                    style={{ width: `${usagePercent}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs font-semibold opacity-90">
                                                <span>Usado: {usagePercent.toFixed(0)}%</span>
                                                <span>Limite: R$ {limit.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => handleDelete(card.id, card.name)}
                                                className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl font-semibold transition text-sm"
                                            >
                                                🗑️ Excluir
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Empty State */}
                    {cards.length === 0 && (
                        <div className="col-span-full">
                            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-200">
                                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mb-6">
                                    <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Nenhum cartão cadastrado</h3>
                                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                                    Cadastre seus cartões de crédito para controlar faturas e limites de forma inteligente.
                                </p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition"
                                >
                                    Cadastrar Primeiro Cartão
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Card Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">
                                {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <form action={async (formData) => {
                            const res = await createCard(null, formData);
                            if (res?.success) {
                                toast.success(res.message);
                                setIsModalOpen(false);
                                window.location.reload();
                            } else {
                                toast.error(res?.message || 'Erro ao criar');
                            }
                        }} className="space-y-6">
                            <input type="hidden" name="userId" value={userId} />

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Cartão</label>
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="Ex: Nubank, Inter, XP"
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-slate-900 font-semibold"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Cor do Cartão</label>
                                    <div className="relative h-14 w-full rounded-xl overflow-hidden border-2 border-slate-200 hover:border-purple-500 transition">
                                        <input
                                            type="color"
                                            name="color"
                                            defaultValue="#820ad1"
                                            className="absolute inset-0 w-full h-full cursor-pointer border-0"
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Toque para escolher</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Limite Total</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-4 text-slate-500 font-semibold">R$</span>
                                        <input
                                            name="limit"
                                            type="number"
                                            step="0.01"
                                            placeholder="5000"
                                            className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-slate-900 font-semibold"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Dia Vencimento</label>
                                    <input
                                        name="dueDay"
                                        type="number"
                                        min="1"
                                        max="31"
                                        placeholder="Ex: 10"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-slate-900 font-semibold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Dia Fechamento</label>
                                    <input
                                        name="closingDay"
                                        type="number"
                                        min="1"
                                        max="31"
                                        placeholder="Ex: 3"
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition text-slate-900 font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition"
                                >
                                    Cancelar
                                </button>
                                <SubmitButton />
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
