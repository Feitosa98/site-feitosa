'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logAction } from '@/lib/audit';

export async function createOS(data: any) {
    try {
        const os = await prisma.serviceOrder.create({
            data: {
                equipment: data.equipment,
                issue: data.issue,
                clientId: data.clientId,
                notes: data.notes || null,
                status: 'ABERTO'
            }
        });

        await logAction('CREATE_OS', `Ordem de Serviço criada: ${os.id} - Equipamento: ${data.equipment}`);
        revalidatePath('/admin/os');
        return { success: true, os };
    } catch (error: any) {
        console.error('Error creating OS:', error);
        return { success: false, error: 'Erro ao criar OS' };
    }
}

export async function updateOSStatus(id: string, status: string) {
    try {
        await prisma.serviceOrder.update({
            where: { id },
            data: { status }
        });

        await logAction('UPDATE_OS_STATUS', `OS ${id} atualizada para ${status}`);
        revalidatePath('/admin/os');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: 'Erro ao atualizar status' };
    }
}

export async function generateChargeFromOS(osId: string, chargeData: any) {
    try {
        const os = await prisma.serviceOrder.findUnique({ where: { id: osId }, include: { client: true } });
        if (!os) throw new Error('OS não encontrada');
        if (os.chargeId) throw new Error('OS já possui cobrança');

        const charge = await prisma.charge.create({
            data: {
                description: `Serviço (OS #${osId.slice(-4)}): ${os.equipment} - ${os.issue}`,
                value: parseFloat(chargeData.value),
                dueDate: new Date(chargeData.dueDate),
                status: 'PENDENTE',
                clientId: os.clientId,
                serviceOrder: {
                    connect: { id: osId }
                }
            },
            include: { client: true }
        });

        // Update OS status to concluded if generating charge? Maybe let user decide.
        // For now, let's keep OS independent or update to waiting payment? 
        // Let's set to 'CONCLUIDO' as the service is likely done to generate charge.
        await prisma.serviceOrder.update({
            where: { id: osId },
            data: { status: 'CONCLUIDO' }
        });

        await logAction('GENERATE_CHARGE_OS', `Cobrança gerada a partir da OS ${osId}`);
        revalidatePath('/admin/os');
        revalidatePath('/admin/financeiro');
        return { success: true };
    } catch (error: any) {
        console.error('Error generating charge from OS:', error);
        return { success: false, error: error.message };
    }
}
