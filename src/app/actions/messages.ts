'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createMessage(clientId: string, subject: string, content: string, type: string = 'GENERAL') {
    try {
        await prisma.message.create({
            data: {
                clientId,
                subject,
                content,
                type,
                status: 'OPEN'
            }
        });
        revalidatePath('/portal/suporte');
        revalidatePath('/admin/mensagens');
        return { success: true };
    } catch (error) {
        console.error('Error creating message:', error);
        return { success: false, error: 'Failed to create message' };
    }
}

export async function getClientMessages(clientId: string) {
    try {
        return await prisma.message.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            include: { responses: { include: { user: true } } }
        });
    } catch (error) {
        console.error('Error fetching client messages:', error);
        return [];
    }
}

export async function getAllMessages() {
    try {
        return await prisma.message.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: true,
                responses: { include: { user: true } }
            }
        });
    } catch (error) {
        console.error('Error fetching all messages:', error);
        return [];
    }
}

export async function respondToMessage(messageId: string, userId: string, content: string) {
    try {
        await prisma.messageResponse.create({
            data: {
                messageId,
                userId,
                content
            }
        });

        // Update message status if needed, e.g., to 'OPEN' if it was closed, or keep it open.
        // For now, let's assuming responding keeps it open or re-opens it.

        revalidatePath('/admin/mensagens');
        revalidatePath('/portal/suporte');
        return { success: true };
    } catch (error) {
        console.error('Error responding to message:', error);
        return { success: false, error: 'Failed to respond' };
    }
}

export async function updateMessageStatus(messageId: string, status: string) {
    try {
        await prisma.message.update({
            where: { id: messageId },
            data: { status }
        });
        revalidatePath('/admin/mensagens');
        return { success: true };
    } catch (error) {
        console.error('Error updating status:', error);
        return { success: false };
    }
}
