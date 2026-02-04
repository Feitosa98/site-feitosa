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
            margin: 40,
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
        const pageHeight = doc.page.height;
        const margin = 40;
        const contentWidth = pageWidth - (margin * 2);

        // Colors
        const primaryColor = '#0f172a'; // Darker, more professional blue/slate
        const accentColor = '#3b82f6';  // Bright blue for highlights
        const secondaryColor = '#64748b'; // Slate 500
        const lightBg = '#f8fafc';        // Slate 50
        const borderColor = '#e2e8f0';    // Slate 200

        // ================= HEADER =================
        let y = margin;

        // Logo (Left)
        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-feitosa.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, margin, y, { width: 100 });
        } else {
            // Fallback text logo if image missing
            doc.font(fontBold).fontSize(18).fillColor(primaryColor).text('FEITOSA', margin, y);
            doc.fontSize(10).font(fontRegular).text('SOLUÇÕES', margin, y + 20);
        }

        // Company Info (Right)
        doc.font(fontBold).fontSize(10).fillColor(primaryColor).text('Feitosa Soluções em Informática', margin, y, { align: 'right', width: contentWidth });
        doc.font(fontRegular).fontSize(9).fillColor(secondaryColor)
            .text('CNPJ: 35.623.245/0001-50', margin, y + 15, { align: 'right', width: contentWidth })
            .text('Manaus - Amazonas', margin, y + 28, { align: 'right', width: contentWidth })
            .text('contato@feitosa.com.br', margin, y + 41, { align: 'right', width: contentWidth });

        // Divider
        y += 70;
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke(borderColor);
        y += 30;

        // ================= TITLE & STATUS =================
        doc.font(fontBold).fontSize(24).fillColor(primaryColor).text('Fatura de Serviços', margin, y);

        // Status Badge
        const statusConfig: any = {
            'PENDENTE': { color: '#d97706', bg: '#fef3c7', label: 'AGUARDANDO PAGAMENTO' },
            'PAGO': { color: '#059669', bg: '#d1fae5', label: 'PAGO' },
            'VENCIDO': { color: '#dc2626', bg: '#fee2e2', label: 'VENCIDO' }
        };
        const status = statusConfig[charge.status] || statusConfig['PENDENTE'];

        // Right grouped status
        const statusWidth = 160;
        doc.roundedRect(pageWidth - margin - statusWidth, y, statusWidth, 26, 13).fill(status.bg);
        doc.font(fontBold).fontSize(9).fillColor(status.color)
            .text(status.label, pageWidth - margin - statusWidth, y + 8, { width: statusWidth, align: 'center' });

        y += 40;

        // ================= INFO GRID =================
        // Gray background box for details
        doc.roundedRect(margin, y, contentWidth, 110, 8).fill(lightBg);

        const col1 = margin + 20;
        const col2 = margin + 20 + (contentWidth / 3);
        const col3 = margin + 20 + (contentWidth / 3) * 2;
        const rowHeaderY = y + 20;
        const rowValueY = y + 40;

        // Col 1: Fatura Info
        doc.font(fontBold).fontSize(8).fillColor(secondaryColor).text('NÚMERO DA FATURA', col1, rowHeaderY);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor).text(`#${charge.id.slice(-8).toUpperCase()}`, col1, rowValueY);

        doc.font(fontBold).fontSize(8).fillColor(secondaryColor).text('DATA DE EMISSÃO', col1, rowHeaderY + 35);
        doc.font(fontRegular).fontSize(11).fillColor(primaryColor).text(new Date(charge.createdAt).toLocaleDateString('pt-BR'), col1, rowValueY + 35);

        // Col 2: Cliente
        doc.font(fontBold).fontSize(8).fillColor(secondaryColor).text('FATURADO PARA', col2, rowHeaderY);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor).text(charge.client.name, col2, rowValueY, { width: (contentWidth / 3) - 20 });
        doc.font(fontRegular).fontSize(10).fillColor(secondaryColor).text(charge.client.cpfCnpj, col2, doc.y + 4);

        // Col 3: Vencimento & Valor
        doc.font(fontBold).fontSize(8).fillColor(secondaryColor).text('VENCIMENTO', col3, rowHeaderY);
        doc.font(fontBold).fontSize(11).fillColor(primaryColor).text(new Date(charge.dueDate).toLocaleDateString('pt-BR'), col3, rowValueY);

        doc.font(fontBold).fontSize(8).fillColor(secondaryColor).text('VALOR TOTAL', col3, rowHeaderY + 35);
        doc.font(fontBold).fontSize(16).fillColor(primaryColor).text(`R$ ${charge.value.toFixed(2).replace('.', ',')}`, col3, rowValueY + 30);

        y += 130;

        // ================= DESCRIPTION =================
        doc.font(fontBold).fontSize(12).fillColor(primaryColor).text('Descrição dos Serviços', margin, y);
        y += 15;

        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).stroke(borderColor);
        y += 15;

        // Description Body
        doc.font(fontRegular).fontSize(10).fillColor('#334155').text(charge.description, margin, y, { width: contentWidth, align: 'justify' });
        y = doc.y + 10;

        if (charge.service) {
            doc.font(fontBold).fontSize(9).fillColor(secondaryColor).text('Serviço Relacionado:', margin, y);
            doc.font(fontRegular).fontSize(10).fillColor('#334155').text(charge.service.name, margin + 110, y);
            y += 20;
        }

        if (charge.notes) {
            y += 10;
            doc.font(fontBold).fontSize(9).fillColor(secondaryColor).text('Observações:', margin, y);
            doc.font(fontRegular).fontSize(9).fillColor('#334155').text(charge.notes, margin, y + 15, { width: contentWidth });
            y = doc.y + 10;
        }

        y += 30;

        // ================= PIX SECTION (Bottom) =================
        const isPending = charge.status === 'PENDENTE' || charge.status === 'VENCIDO';

        if (isPending) {
            // Keep on same page if space permits, else new page
            if (y + 250 > pageHeight) {
                doc.addPage({ margin: 40 });
                y = 40;
            }

            // Background for Payment Area
            doc.roundedRect(margin, y, contentWidth, 220, 12).fill('#f1f5f9');

            // PIX Header
            doc.image(path.join(process.cwd(), 'public', 'images', 'pix-logo.png'), margin + 20, y + 20, { width: 60 });
            doc.font(fontBold).fontSize(14).fillColor(primaryColor).text('Pagamento via PIX', margin + 90, y + 25);
            doc.font(fontRegular).fontSize(10).fillColor(secondaryColor).text('Escaneie o QR Code ou use o Copia e Cola', margin + 90, y + 45);

            const pixY = y + 70;

            // Left: Copia e Cola
            const payload = buildPixPayload({
                pixKey: '35623245000150',
                merchantName: 'FEITOSA SOLUCOES',
                merchantCity: 'MANAUS',
                txId: charge.id.slice(-25),
                amount: charge.value.toFixed(2)
            });

            // Generate QR
            const qrCodeDataUrl = await QRCode.toDataURL(payload, { margin: 1 });
            const qrCodeImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

            // Draw QR Code on Right
            doc.white.roundedRect(pageWidth - margin - 150, pixY, 130, 130, 8).fill();
            doc.image(qrCodeImage, pageWidth - margin - 145, pixY + 5, { width: 120 });

            // Draw Copy Paste Text area
            const copyTextFieldWidth = contentWidth - 180;
            doc.font(fontBold).fontSize(9).fillColor(secondaryColor).text('Código Copia e Cola:', margin + 20, pixY);

            doc.roundedRect(margin + 20, pixY + 15, copyTextFieldWidth, 80, 4).fill('#ffffff').stroke('#cbd5e1');
            doc.font('Courier').fontSize(8).fillColor('#334155')
                .text(payload, margin + 30, pixY + 25, { width: copyTextFieldWidth - 20, height: 60 });

            doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
                .text('Abra o app do seu banco > Área PIX > PIX Copia e Cola', margin + 20, pixY + 110);
        }

        doc.end();

        const pdfBuffer = await new Promise<Buffer>((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });

        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="fatura-${charge.id.slice(-8)}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Erro ao gerar PDF: ' + error.message }, { status: 500 });
    }
}
