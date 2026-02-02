
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function syncFromPortal() {
    try {
        // MOCK: Fetch from "External API"
        // In real life: await axios.get('https://nfse.gov.br/API/sync', ...)

        await new Promise(r => setTimeout(r, 2000)); // Simulate delay

        // Mock Clients
        const mockClients = [
            { name: 'Empresa Cliente A Ltda', cpfCnpj: '12.345.678/0001-90', email: 'contato@clientea.com', address: 'Rua das Flores, 123' },
            { name: 'João da Silva ME', cpfCnpj: '98.765.432/0001-10', email: 'joao@silva.com', address: 'Av. Paulista, 1000' },
            { name: 'Tech Solutions SA', cpfCnpj: '11.222.333/0001-44', email: 'financeiro@techsol.com', address: 'Centro Empresarial, Sala 5' }
        ];

        let addedClients = 0;
        for (const client of mockClients) {
            const exists = await prisma.client.findUnique({ where: { cpfCnpj: client.cpfCnpj } });
            if (!exists) {
                await prisma.client.create({ data: client });
                addedClients++;
            }
        }

        // Mock Notes (Historic)
        const mockNotes = [
            { numero: 2024001, codigoVerificacao: 'AAAA-1111', value: 1500.00, clientCpfCnpj: '12.345.678/0001-90', clientName: 'Empresa Cliente A Ltda', status: 'CONCLUIDO', emissionDate: new Date('2024-01-15') },
            { numero: 2024002, codigoVerificacao: 'BBBB-2222', value: 2500.50, clientCpfCnpj: '98.765.432/0001-10', clientName: 'João da Silva ME', status: 'CONCLUIDO', emissionDate: new Date('2024-02-20') },
            { numero: 2024003, codigoVerificacao: 'CCCC-3333', value: 5000.00, clientCpfCnpj: '11.222.333/0001-44', clientName: 'Tech Solutions SA', status: 'CANCELADO', emissionDate: new Date('2024-03-10') }
        ];

        let addedNotes = 0;
        for (const note of mockNotes) {
            const exists = await prisma.note.findFirst({ where: { numero: note.numero } });
            if (!exists) {
                await prisma.note.create({
                    data: {
                        ...note,
                        clientName: note.clientName,
                        clientCpfCnpj: note.clientCpfCnpj,
                        description: 'Serviços de consultoria em TI (Importado)',
                        // Try to link to client if exists
                        client: { connect: { cpfCnpj: note.clientCpfCnpj } }
                    }
                });
                addedNotes++;
            }
        }

        revalidatePath('/admin/config');
        revalidatePath('/admin/clients');
        revalidatePath('/admin/notas');

        return {
            success: true,
            message: `Sincronização concluída! ${addedClients} novos clientes e ${addedNotes} notas importadas do Portal.`
        };

    } catch (e: any) {
        console.error(e);
        return { success: false, message: 'Erro ao sincronizar: ' + e.message };
    }
}
