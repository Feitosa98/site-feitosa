'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to get the current client ID
// For this prototype, we'll try to find a client by the user's email, 
// or if it's the mock "client" user, we'll grab the first client in the DB.
async function getClientId() {
    const session = await auth();
    if (!session?.user) return null;

    if (session.user.email === 'client@example.com') {
        const firstClient = await prisma.client.findFirst();
        return firstClient?.id;
    }

    // Real scenario: match email
    const client = await prisma.client.findFirst({
        where: { email: session.user.email || '' }
    });
    return client?.id;
}

export async function getAssets() {
    const clientId = await getClientId();
    if (!clientId) return [];

    return await prisma.asset.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function createAsset(formData: FormData) {
    const clientId = await getClientId();
    if (!clientId) throw new Error('Cliente não identificado');

    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const description = formData.get('description') as string;
    const valueStr = formData.get('value') as string;
    const purchaseDateStr = formData.get('purchaseDate') as string;

    const value = valueStr ? parseFloat(valueStr.replace('R$', '').replace('.', '').replace(',', '.')) : null;
    const purchaseDate = purchaseDateStr ? new Date(purchaseDateStr) : null;

    await prisma.asset.create({
        data: {
            name,
            code,
            description,
            value,
            purchaseDate,
            clientId
        }
    });
}

export async function deleteAsset(id: string) {
    const clientId = await getClientId();
    if (!clientId) throw new Error('Cliente não identificado');

    await prisma.asset.delete({
        where: { id, clientId } // Ensure ownership
    });
}
