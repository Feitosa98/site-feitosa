import { auth } from '@/auth';
import { emitNfse } from '@/lib/nfse-service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const session = await auth();

    // Server-side check: Only admin can emit
    if (!session || (session.user as any).role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Basic Validation
        if (!body.clientName || !body.value) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
        }

        // Call real NFS-e service
        const result = await emitNfse({
            clientName: body.clientName,
            clientCpfCnpj: body.clientCpfCnpj || '00000000000',
            value: parseFloat(body.value),
            description: body.description,
            clientId: body.clientId
        });

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('Emit API Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
