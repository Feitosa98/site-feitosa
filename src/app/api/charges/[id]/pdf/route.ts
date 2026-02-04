import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { buildPixPayload } from '@/lib/pix';
import QRCode from 'qrcode';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get charge data
        const charge = await prisma.charge.findUnique({
            where: { id },
            include: {
                client: true,
                service: true
            }
        });

        if (!charge) {
            return NextResponse.json({ error: 'Cobrança não encontrada' }, { status: 404 });
        }

        const user = session.user as any;
        if (user.role !== 'admin' && charge.clientId !== user.clientId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fonts
        const fontsPath = path.join(process.cwd(), 'public', 'fonts');
        const fontRegularPath = path.join(fontsPath, 'Roboto-Regular.ttf');
        const fontBoldPath = path.join(fontsPath, 'Roboto-Bold.ttf');

        // Create PDF
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            font: fontRegularPath
        });

        const fontRegular = 'Roboto-Regular';
        const fontBold = 'Roboto-Bold';
        doc.registerFont(fontRegular, fontRegularPath);
        doc.registerFont(fontBold, fontBoldPath);

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // Page dimensions
        const pageWidth = doc.page.width;
        const margin = 50;
        const contentWidth = pageWidth - (margin * 2);
        let y = margin;

        // Colors
        const primaryColor = '#1e3a8a';
        const secondaryColor = '#64748b';
        const lightBg = '#f1f5f9';

        // Header
        doc.rect(0, 0, pageWidth, 100).fill(primaryColor);
        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-feitosa.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, margin, y + 10, { width: 120 });
        }
        doc.font(fontBold).fontSize(20).fillColor('#ffffff')
            .text('COBRANÇA', pageWidth / 2 - 100, y + 30, { width: 200, align: 'center' });
        doc.fontSize(10).fillColor('#ffffff')
            .text('Feitosa Soluções em Informática', pageWidth / 2 - 100, y + 55, { width: 200, align: 'center' });

        y = 120;

        // Charge summary
        doc.roundedRect(margin, y, contentWidth, 60, 5).fill(lightBg);
        doc.font(fontBold).fontSize(14).fillColor(primaryColor)
            .text(`Cobrança #${charge.id.slice(-8).toUpperCase()}`, margin + 20, y + 15);

        const statusColors: any = {
            'PENDENTE': { bg: '#fef3c7', text: '#f59e0b' },
            'PAGO': { bg: '#d1fae5', text: '#10b981' },
            'VENCIDO': { bg: '#fee2e2', text: '#ef4444' }
        };
        const statusColor = statusColors[charge.status] || statusColors['PENDENTE'];
        doc.roundedRect(pageWidth - margin - 120, y + 10, 100, 25, 3).fill(statusColor.bg);
        doc.font(fontBold).fontSize(10).fillColor(statusColor.text)
            .text(charge.status, pageWidth - margin - 120, y + 17, { width: 100, align: 'center' });

        doc.font(fontRegular).fontSize(9).fillColor(secondaryColor)
            .text(`Emitida em: ${new Date(charge.createdAt).toLocaleDateString('pt-BR')}`, margin + 20, y + 38);

        y += 80;

        // Participants Info
        const colWidth = contentWidth / 2 - 10;

        // Provider
        doc.roundedRect(margin, y, colWidth, 110, 5).stroke(primaryColor);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor).text('Prestador', margin + 15, y + 12);
        doc.font(fontRegular).fontSize(9).fillColor('#000000')
            .text('Feitosa Soluções em Informática', margin + 15, y + 30)
            .text('CNPJ: 35.623.245/0001-50', margin + 15, y + 45)
            .text('Av. Exemplo, 1000 — Manaus/AM', margin + 15, y + 60)
            .text('CEP 69000-000', margin + 15, y + 75)
            .text('contato@feitosa.com.br', margin + 15, y + 90);

        // Client
        doc.roundedRect(margin + colWidth + 20, y, colWidth, 110, 5).stroke(primaryColor);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor).text('Cliente', margin + colWidth + 35, y + 12);
        doc.font(fontRegular).fontSize(9).fillColor('#000000')
            .text(charge.client.name, margin + colWidth + 35, y + 30, { width: colWidth - 30 })
            .text(`CPF/CNPJ: ${charge.client.cpfCnpj}`, margin + colWidth + 35, y + 45);

        let clientY = y + 60;
        if (charge.client.address) {
            doc.text(charge.client.address, margin + colWidth + 35, clientY, { width: colWidth - 30 });
            clientY += 25;
        }
        if (charge.client.email || charge.client.phone) {
            doc.text(`${charge.client.email || ''} ${charge.client.phone || ''}`, margin + colWidth + 35, clientY);
        }

        y += 130;

        // Description
        doc.roundedRect(margin, y, contentWidth, 100, 5).stroke(primaryColor);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor).text('Detalhes', margin + 15, y + 12);
        doc.font(fontRegular).fontSize(10).fillColor('#000000')
            .text(charge.description, margin + 15, y + 35, { width: contentWidth - 30 });
        if (charge.service) {
            doc.font(fontRegular).fontSize(9).fillColor(secondaryColor).text(`Serviço: ${charge.service.name}`, margin + 15, y + 75);
        }

        y += 120;

        // Payment and PIX
        const isPending = charge.status === 'PENDENTE' || charge.status === 'VENCIDO';

        if (isPending) {
            const pixPayload = buildPixPayload({
                pixKey: '35623245000150',
                merchantName: 'FEITOSA SOLUCOES EM INFORMATICA',
                merchantCity: 'MANAUS',
                txId: charge.id.slice(-25),
                amount: charge.value.toFixed(2)
            });

            const qrCodeDataUrl = await QRCode.toDataURL(pixPayload, { margin: 1 });
            const qrCodeImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

            doc.roundedRect(margin, y, contentWidth, 180, 5).fill(lightBg);

            // Left side: Valor and Vencimento
            doc.font(fontBold).fontSize(10).fillColor(secondaryColor).text('VALOR TOTAL', margin + 20, y + 20);
            doc.font(fontBold).fontSize(24).fillColor(primaryColor).text(`R$ ${charge.value.toFixed(2).replace('.', ',')}`, margin + 20, y + 35);

            doc.font(fontBold).fontSize(10).fillColor(secondaryColor).text('VENCIMENTO', margin + 20, y + 80);
            doc.font(fontBold).fontSize(16).fillColor('#000000').text(new Date(charge.dueDate).toLocaleDateString('pt-BR'), margin + 20, y + 95);

            // Right side: QR Code
            doc.image(qrCodeImage, pageWidth - margin - 150, y + 15, { width: 130 });
            doc.font(fontBold).fontSize(8).fillColor(primaryColor).text('PAGUE COM PIX', pageWidth - margin - 150, y + 150, { width: 130, align: 'center' });

            y += 200;
        } else {
            doc.roundedRect(margin, y, contentWidth, 80, 5).fill(lightBg);
            doc.font(fontBold).fontSize(12).fillColor(primaryColor).text('VALOR TOTAL:', margin + 20, y + 30);
            doc.font(fontBold).fontSize(20).text(`R$ ${charge.value.toFixed(2).replace('.', ',')}`, margin + 150, y + 25);
            y += 100;
        }

        if (charge.notes) {
            doc.font(fontBold).fontSize(10).fillColor(primaryColor).text('Observações:', margin, y);
            doc.font(fontRegular).fontSize(9).fillColor(secondaryColor).text(charge.notes, margin, y + 15, { width: contentWidth });
        }

        // Footer
        y = doc.page.height - 70;
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke('#e5e7eb');
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Feitosa Soluções em Informática | CNPJ: 35.623.245/0001-50', margin, y + 15, { align: 'center' })
            .text('contato@feitosa.com.br', margin, y + 30, { align: 'center' });

        doc.end();

        const pdfBuffer = await new Promise<Buffer>((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });

        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="cobranca-${charge.id.slice(-8)}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Erro ao gerar PDF: ' + error.message }, { status: 500 });
    }
}
