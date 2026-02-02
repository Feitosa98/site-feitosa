
import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const path = require('path');
        const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');

        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, font: fontPath });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            doc.fontSize(20).text('Teste de PDF', 100, 100);
            doc.end();
        });

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', 'inline; filename="test.pdf"');

        return new Response(pdfBuffer as any, { status: 200, headers });
    } catch (error: any) {
        console.error("PDF Test Error:", error);
        return NextResponse.json({ error: 'Erro: ' + error.message }, { status: 500 });
    }
}
