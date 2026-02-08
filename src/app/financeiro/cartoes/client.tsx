'use client';

import { useState } from 'react';
// import { useFormStatus } from 'react-dom'; // Not used in the main component but in the helper
import { createCard } from '@/app/actions/finance-cards';
import { toast } from 'sonner';

// Helper for Submit Button
function SubmitButton() {
    // We need to handle pending state. Since useFormStatus must be used inside a form element,
    // we can either extract this button or use useActionState in React 19 (but Next.js 14/15 might be used).
    // Let's keep it simple for now or usage standard hook if available.
    // For simplicity in this `client.tsx` without extra imports or complexity:
    return (
        <button type="submit" className="bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800">
            Salvar Cartão
        </button>
    );
}

export default function CreditCardsClient({ cards = [], userId }: { cards: any[], userId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Meus Cartões</h1>
                    <p className="text-zinc-500 mt-1">Gerencie seus limites e datas de fechamento.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition flex items-center gap-2"
                >
                    + Novo Cartão
                </button>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card) => {
                    const limit = card.limit || 0;
                    const invoice = card.currentInvoice || 0;
                    const usagePercent = limit > 0 ? Math.min((invoice / limit) * 100, 100) : 0;
                    const available = limit - invoice;

                    // Text color logic based on background brightness could be added,
                    // but for now we force white text on colored cards.

                    return (
                        <div key={card.id} className="relative overflow-hidden rounded-2xl shadow-lg transition hover:scale-[1.02] duration-300 group text-white">
                            {/* Card Background */}
                            <div
                                className="absolute inset-0 z-0"
                                style={{ backgroundColor: card.color || '#3b82f6' }}
                            />

                            {/* Card Content */}
                            <div className="relative z-10 p-6 h-full flex flex-col justify-between min-h-[220px]">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                            {/* Generic Credit Card Icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold drop-shadow-sm">{card.name}</h3>
                                        </div>
                                    </div>
                                    <div className="text-right bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                                        <p className="text-[10px] uppercase opacity-80 font-semibold tracking-wider">Fecha dia</p>
                                        <span className="font-mono text-lg font-bold">{card.closingDay}</span>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs opacity-80 mb-1 font-medium">Fatura Atual</p>
                                            <p className="text-2xl font-bold tracking-tight">R$ {invoice.toFixed(2)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs opacity-80 mb-1 font-medium">Disponível</p>
                                            <p className="text-sm font-semibold">R$ {available.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-red-400' : 'bg-white'}`}
                                            style={{ width: `${usagePercent}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-[11px] font-medium opacity-80 pt-1">
                                        <span>Usado: {usagePercent.toFixed(0)}%</span>
                                        <span>Limite Total: R$ {limit.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State */}
                {cards.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50">
                        <div className="mx-auto w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        </div>
                        <h3 className="text-lg font-medium text-zinc-900">Nenhum cartão cadastrado</h3>
                        <p className="text-zinc-500 mt-1 max-w-sm mx-auto">Cadastre seus cartões de crédito para controlar faturas e limites.</p>
                        <button onClick={() => setIsModalOpen(true)} className="mt-6 text-indigo-600 font-semibold hover:text-indigo-700">
                            Cadastrar agora &rarr;
                        </button>
                    </div>
                )}
            </div>

            {/* Add Card Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-zinc-900">Novo Cartão</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form action={async (formData) => {
                            // Using standard form action for now. In a real Client Component with complex state, usually we'd use useFormState.
                            const res = await createCard(null, formData);
                            if (res?.success) {
                                toast.success(res.message);
                                setIsModalOpen(false);
                            } else {
                                toast.error(res?.message || 'Erro ao criar');
                            }
                        }} className="space-y-5">
                            <input type="hidden" name="userId" value={userId} />

                            <div>
                                <label className="block text-sm font-semibold text-zinc-700 mb-2">Nome do Cartão</label>
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="Ex: Nubank, Inter, XP"
                                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-zinc-900 outline-none transition"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Cor do Cartão</label>
                                    <div className="relative h-11 w-full rounded-lg overflow-hidden border border-zinc-200">
                                        <input
                                            type="color"
                                            name="color"
                                            defaultValue="#820ad1"
                                            className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] cursor-pointer p-0 m-0 border-0"
                                        />
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-1">Toque para escolher</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Limite Total</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-zinc-500">R$</span>
                                        <input
                                            name="limit"
                                            type="number"
                                            step="0.01"
                                            placeholder="5000"
                                            className="w-full p-2.5 pl-9 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-zinc-900 outline-none transition"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Dia Vencimento</label>
                                    <input
                                        name="dueDay"
                                        type="number"
                                        min="1"
                                        max="31"
                                        placeholder="Ex: 10"
                                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-zinc-900 outline-none transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Dia Fechamento</label>
                                    <input
                                        name="closingDay"
                                        type="number"
                                        min="1"
                                        max="31"
                                        placeholder="Ex: 3"
                                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-zinc-900 outline-none transition"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-medium transition"
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
