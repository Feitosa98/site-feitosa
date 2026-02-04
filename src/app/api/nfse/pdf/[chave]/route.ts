import { baixarDanfsePdf } from '@/lib/nfse/client';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ chave: string }> }
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { chave } = await params;

        if (!chave) {
            return NextResponse.json({ error: 'Chave não informada' }, { status: 400 });
        }

        const pdfBuffer = await baixarDanfsePdf(chave);

        // Serve PDF
        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="DANFSE-${chave}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('Erro ao baixar PDF:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
