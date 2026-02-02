import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

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

        // Fonts
        const fontsPath = path.join(process.cwd(), 'public', 'fonts');
        const fontRegular = 'Roboto-Regular';
        const fontBold = 'Roboto-Bold';
        const fontRegularPath = path.join(fontsPath, 'Roboto-Regular.ttf');
        const fontBoldPath = path.join(fontsPath, 'Roboto-Bold.ttf');

        // Create PDF with default font to avoid loading Helvetica
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            font: fontRegularPath
        });

        // Register fonts
        doc.registerFont(fontRegular, fontRegularPath);
        doc.registerFont(fontBold, fontBoldPath);

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => { });

        // Colors
        const primaryColor = '#1e3a8a'; // Dark blue from logo
        const secondaryColor = '#64748b';
        const lightBg = '#f1f5f9';
        const successColor = '#10b981';

        // Page dimensions
        const pageWidth = doc.page.width;
        const margin = 50;
        const contentWidth = pageWidth - (margin * 2);
        let y = margin;

        // Header with logo and title
        doc.rect(0, 0, pageWidth, 100).fill(primaryColor);

        // Logo (if exists)
        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-feitosa.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, margin, y + 10, { width: 120 });
        }

        // Title
        doc.font(fontBold).fontSize(20).fillColor('#ffffff')
            .text('COBRANÇA', pageWidth / 2 - 100, y + 30, { width: 200, align: 'center' });

        doc.fontSize(10).fillColor('#ffffff')
            .text('Feitosa Soluções em Informática', pageWidth / 2 - 100, y + 55, { width: 200, align: 'center' });

        y = 120;

        // Charge number and status
        doc.roundedRect(margin, y, contentWidth, 60, 5).fill(lightBg);

        doc.font(fontBold).fontSize(14).fillColor(primaryColor)
            .text(`Cobrança #${charge.id.slice(-8).toUpperCase()}`, margin + 20, y + 15);

        const statusColors: any = {
            'PENDENTE': { bg: '#fef3c7', text: '#f59e0b' },
            'PAGO': { bg: '#d1fae5', text: '#10b981' },
            'VENCIDO': { bg: '#fee2e2', text: '#ef4444' },
            'CANCELADO': { bg: '#e5e7eb', text: '#6b7280' }
        };

        const statusColor = statusColors[charge.status] || statusColors['PENDENTE'];
        doc.roundedRect(pageWidth - margin - 120, y + 10, 100, 25, 3)
            .fill(statusColor.bg);
        doc.font(fontBold).fontSize(10).fillColor(statusColor.text)
            .text(charge.status, pageWidth - margin - 120, y + 17, { width: 100, align: 'center' });

        doc.font(fontRegular).fontSize(9).fillColor(secondaryColor)
            .text(`Emitida em: ${new Date(charge.createdAt).toLocaleDateString('pt-BR')}`, margin + 20, y + 38);

        y += 80;

        // Client and Company info side by side
        const colWidth = contentWidth / 2 - 10;

        // Company info (left)
        doc.roundedRect(margin, y, colWidth, 110, 5).stroke(primaryColor);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor)
            .text('Prestador', margin + 15, y + 12);

        doc.font(fontRegular).fontSize(9).fillColor('#000000')
            .text('Feitosa Soluções em Informática', margin + 15, y + 30)
            .text('CNPJ: 35.623.245/0001-50', margin + 15, y + 45)
            .text('Av. Exemplo, 1000 — Manaus/AM', margin + 15, y + 60)
            .text('CEP 69000-000', margin + 15, y + 75)
            .text('contato@feitosa.com.br', margin + 15, y + 90);

        // Client info (right)
        doc.roundedRect(margin + colWidth + 20, y, colWidth, 110, 5).stroke(primaryColor);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor)
            .text('Cliente', margin + colWidth + 35, y + 12);

        doc.font(fontRegular).fontSize(9).fillColor('#000000')
            .text(charge.client.name, margin + colWidth + 35, y + 30, { width: colWidth - 30 })
            .text(`CPF/CNPJ: ${charge.client.cpfCnpj}`, margin + colWidth + 35, y + 45);

        if (charge.client.email) {
            doc.text(`Email: ${charge.client.email}`, margin + colWidth + 35, y + 60);
        }
        if (charge.client.phone) {
            doc.text(`Telefone: ${charge.client.phone}`, margin + colWidth + 35, y + 75);
        }

        y += 130;

        // Service details
        doc.roundedRect(margin, y, contentWidth, 120, 5).stroke(primaryColor);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor)
            .text('Detalhes da Cobrança', margin + 15, y + 12);

        doc.font(fontRegular).fontSize(9).fillColor(secondaryColor)
            .text('Descrição:', margin + 15, y + 35);
        doc.font(fontRegular).fontSize(10).fillColor('#000000')
            .text(charge.description, margin + 15, y + 50, { width: contentWidth - 30 });

        if (charge.service) {
            doc.font(fontRegular).fontSize(9).fillColor(secondaryColor)
                .text('Serviço:', margin + 15, y + 85);
            doc.font(fontRegular).fontSize(10).fillColor('#000000')
                .text(charge.service.name, margin + 15, y + 100);
        }

        y += 140;

        // Payment details
        doc.roundedRect(margin, y, contentWidth, 100, 5).fill(lightBg);

        const detailsY = y + 15;
        const detailsCol1 = margin + 20;
        const detailsCol2 = margin + contentWidth / 2;

        doc.font(fontBold).fontSize(9).fillColor(secondaryColor)
            .text('VENCIMENTO', detailsCol1, detailsY);
        doc.font(fontBold).fontSize(12).fillColor('#000000')
            .text(new Date(charge.dueDate).toLocaleDateString('pt-BR'), detailsCol1, detailsY + 15);

        if (charge.paymentDate) {
            doc.font(fontBold).fontSize(9).fillColor(secondaryColor)
                .text('PAGAMENTO', detailsCol1, detailsY + 45);
            doc.font(fontBold).fontSize(12).fillColor('#10b981')
                .text(new Date(charge.paymentDate).toLocaleDateString('pt-BR'), detailsCol1, detailsY + 60);
        }

        if (charge.paymentType) {
            doc.font(fontBold).fontSize(9).fillColor(secondaryColor)
                .text('FORMA DE PAGAMENTO', detailsCol2, detailsY);
            doc.font(fontBold).fontSize(12).fillColor('#000000')
                .text(charge.paymentType, detailsCol2, detailsY + 15);
        }

        doc.font(fontBold).fontSize(9).fillColor(secondaryColor)
            .text('VALOR TOTAL', detailsCol2, detailsY + 45);
        doc.font(fontBold).fontSize(18).fillColor(primaryColor)
            .text(`R$ ${charge.value.toFixed(2).replace('.', ',')}`, detailsCol2, detailsY + 60);

        y += 120;

        // Notes (if any)
        if (charge.notes) {
            doc.font(fontBold).fontSize(10).fillColor(primaryColor)
                .text('Observações:', margin, y);
            doc.font(fontRegular).fontSize(9).fillColor(secondaryColor)
                .text(charge.notes, margin, y + 15, { width: contentWidth });
            y += 50;
        }

        // Footer
        y = doc.page.height - 80;
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke('#e5e7eb');

        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Feitosa Soluções em Informática', margin, y + 10, { width: contentWidth, align: 'center' })
            .text('contato@feitosa.com.br | (92) 99999-9999', margin, y + 25, { width: contentWidth, align: 'center' })
            .text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, margin, y + 40, { width: contentWidth, align: 'center' });

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
