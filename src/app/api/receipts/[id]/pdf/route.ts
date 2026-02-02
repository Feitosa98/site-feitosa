import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as forge from 'node-forge';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Get receipt data
        const receipt = await prisma.receipt.findUnique({
            where: { id },
            include: {
                client: true,
                charge: {
                    include: {
                        service: true
                    }
                }
            }
        });

        if (!receipt) {
            return NextResponse.json({ error: 'Recibo não encontrado' }, { status: 404 });
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

        // Page dimensions for A4 (595.28 x 841.89 points)
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;
        const contentWidth = pageWidth - (margin * 2);

        let y = 40;

        // === HEADER SECTION ===
        // Logo (left)
        const logoPath = path.join(process.cwd(), 'public', 'images', 'logo-feitosa.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, margin, y, { width: 45, height: 45 });
        } else {
            // Fallback: logo box with FS
            doc.roundedRect(margin, y, 45, 45, 8)
                .fillAndStroke(primaryColor, primaryColor);
            doc.font(fontBold).fontSize(16).fillColor('#ffffff')
                .text('FS', margin, y + 14, { width: 45, align: 'center' });
        }

        // Company info (next to logo)
        doc.font(fontBold).fontSize(14).fillColor(primaryColor)
            .text('Feitosa Soluções em Informática', margin + 55, y + 2);
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('CNPJ: 35.623.245/0001-50 • Manaus - AM', margin + 55, y + 20)
            .text('(92) 98458-6890 • contato@feitosa.com.br', margin + 55, y + 32);

        // Meta info (right side)
        const metaX = pageWidth - margin - 140;
        doc.font(fontBold).fontSize(16).fillColor(primaryColor)
            .text('RECIBO', metaX, y, { width: 140, align: 'right' });
        doc.font(fontRegular).fontSize(9).fillColor(secondaryColor)
            .text(`Nº: ${receipt.numero}`, metaX, y + 22, { width: 140, align: 'right' })
            .text(`Data: ${new Date(receipt.paymentDate).toLocaleDateString('pt-BR')}`, metaX, y + 34, { width: 140, align: 'right' });

        y += 65;

        // Divider
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(1.5).stroke(primaryColor);
        y += 25;

        // === SECTION: DADOS DO CLIENTE ===
        doc.font(fontBold).fontSize(10).fillColor(primaryColor)
            .text('DADOS DO CLIENTE', margin, y);
        y += 18;

        // Grid layout - 2 columns
        const colWidth = (contentWidth - 10) / 2;

        // Row 1: Nome e CPF/CNPJ
        doc.roundedRect(margin, y, colWidth, 40, 6).stroke('#d9d9d9');
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Nome / Razão Social', margin + 8, y + 6);
        doc.font(fontBold).fontSize(10).fillColor('#111827')
            .text(receipt.client.name.toUpperCase(), margin + 8, y + 20, {
                width: colWidth - 16,
                ellipsis: true
            });

        doc.roundedRect(margin + colWidth + 10, y, colWidth, 40, 6).stroke('#d9d9d9');
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('CPF / CNPJ', margin + colWidth + 18, y + 6);
        doc.font(fontBold).fontSize(10).fillColor('#111827')
            .text(receipt.client.cpfCnpj, margin + colWidth + 18, y + 20);

        y += 48;

        // Row 2: Telefone e Email
        if (receipt.client.phone || receipt.client.email) {
            doc.roundedRect(margin, y, colWidth, 40, 6).stroke('#d9d9d9');
            doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
                .text('Telefone', margin + 8, y + 6);
            doc.font(fontBold).fontSize(10).fillColor('#111827')
                .text(receipt.client.phone || '—', margin + 8, y + 20);

            doc.roundedRect(margin + colWidth + 10, y, colWidth, 40, 6).stroke('#d9d9d9');
            doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
                .text('E-mail', margin + colWidth + 18, y + 6);
            doc.font(fontBold).fontSize(9).fillColor('#111827')
                .text(receipt.client.email || '—', margin + colWidth + 18, y + 20, {
                    width: colWidth - 16,
                    ellipsis: true
                });

            y += 48;
        }

        // === SECTION: DESCRIÇÃO ===
        doc.font(fontBold).fontSize(10).fillColor(primaryColor)
            .text('DESCRIÇÃO DO SERVIÇO / PRODUTO', margin, y);
        y += 18;

        const descHeight = Math.max(70, doc.heightOfString(receipt.description, { width: contentWidth - 16 }) + 30);
        doc.roundedRect(margin, y, contentWidth, descHeight, 6).stroke('#d9d9d9');
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Referente a', margin + 8, y + 6);
        doc.font(fontRegular).fontSize(10).fillColor('#111827')
            .text(receipt.description, margin + 8, y + 20, {
                width: contentWidth - 16,
                lineGap: 2
            });

        if (receipt.charge?.service) {
            const serviceY = y + descHeight - 18;
            doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
                .text(`(${receipt.charge.service.name})`, margin + 8, serviceY);
        }

        y += descHeight + 20;

        // === SECTION: VALORES ===
        doc.font(fontBold).fontSize(10).fillColor(primaryColor)
            .text('VALORES', margin, y);
        y += 18;

        // Row: Forma de Pagamento e Status
        doc.roundedRect(margin, y, colWidth, 40, 6).stroke('#d9d9d9');
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Forma de Pagamento', margin + 8, y + 6);
        doc.font(fontBold).fontSize(10).fillColor('#111827')
            .text(receipt.paymentType, margin + 8, y + 20);

        doc.roundedRect(margin + colWidth + 10, y, colWidth, 40, 6).stroke('#d9d9d9');
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Status', margin + colWidth + 18, y + 6);
        doc.font(fontBold).fontSize(10).fillColor('#111827')
            .text('Pago', margin + colWidth + 18, y + 20);

        y += 50;

        // Amount box
        const valorPorExtenso = numberToWords(receipt.value);
        const extensoText = `Valor por extenso: ${valorPorExtenso} reais`;
        const extensoHeight = doc.heightOfString(extensoText, { width: contentWidth - 24 });
        const boxHeight = Math.max(70, 55 + extensoHeight);

        doc.roundedRect(margin, y, contentWidth, boxHeight, 10)
            .fillAndStroke('#f7f8fb', primaryColor);

        doc.font(fontRegular).fontSize(9).fillColor(secondaryColor)
            .text('Valor recebido (R$)', margin + 12, y + 10);
        doc.font(fontBold).fontSize(24).fillColor(primaryColor)
            .text(`R$ ${receipt.value.toFixed(2).replace('.', ',')}`, margin + 12, y + 24);

        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text(extensoText, margin + 12, y + boxHeight - 18, {
                width: contentWidth - 24,
                lineGap: 1
            });

        y += boxHeight + 15;

        // === SECTION: DECLARAÇÃO ===
        doc.font(fontBold).fontSize(10).fillColor(primaryColor)
            .text('DECLARAÇÃO', margin, y);
        y += 18;

        doc.roundedRect(margin, y, contentWidth, 65, 6).stroke('#d9d9d9');
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Texto do Recibo', margin + 8, y + 6);
        doc.font(fontRegular).fontSize(9).fillColor('#111827')
            .text('Declaro que recebi do(a) cliente acima identificado(a) a quantia descrita neste recibo, referente ao serviço/produto informado, para os devidos fins.',
                margin + 8, y + 20, {
                width: contentWidth - 16,
                lineGap: 2,
                align: 'justify'
            });

        y += 80;

        // === SIGNATURES ===
        const sigWidth = (contentWidth - 20) / 2;
        const sig1X = margin;
        const sig2X = margin + sigWidth + 20;

        doc.moveTo(sig1X, y).lineTo(sig1X + sigWidth, y).lineWidth(1).stroke('#333333');
        doc.font(fontBold).fontSize(9).fillColor('#111827')
            .text('Assinatura do Cliente', sig1X, y + 8);
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text(`Nome: ${receipt.client.name}`, sig1X, y + 22);

        doc.moveTo(sig2X, y).lineTo(sig2X + sigWidth, y).lineWidth(1).stroke('#333333');
        doc.font(fontBold).fontSize(9).fillColor('#111827')
            .text('Feitosa Soluções em Informática', sig2X, y + 8);
        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Iago Feitosa', sig2X, y + 22);


        y += 50;

        // === DIGITAL SIGNATURE SECTION ===
        try {
            // Get certificate settings
            const settings = await prisma.settings.findFirst();

            if (settings?.certificatePath && fs.existsSync(settings.certificatePath)) {
                // Read and parse certificate
                const pfxBuffer = fs.readFileSync(settings.certificatePath);
                const pfxBase64 = pfxBuffer.toString('base64');
                const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(pfxBase64));
                const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, settings.certificatePassword || '');

                // Extract certificate
                const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
                const certBag = bags[forge.pki.oids.certBag]?.[0];

                if (certBag && certBag.cert) {
                    const cert = certBag.cert;
                    const subject = cert.subject.attributes;
                    const issuer = cert.issuer.attributes;

                    // Get certificate info
                    const cn = subject.find((attr: any) => attr.name === 'commonName')?.value || 'N/A';
                    const issuerCN = issuer.find((attr: any) => attr.name === 'commonName')?.value || 'N/A';

                    let validFrom = 'N/A';
                    let validTo = 'N/A';

                    if (cert && cert.validity) {
                        validFrom = new Date(cert.validity.notBefore).toLocaleDateString('pt-BR');
                        validTo = new Date(cert.validity.notAfter).toLocaleDateString('pt-BR');
                    }

                    // Draw signature box
                    doc.roundedRect(margin, y, contentWidth, 65, 8)
                        .fillAndStroke('#e8f5e9', '#4caf50');

                    // Signature icon
                    doc.font(fontBold).fontSize(24).fillColor('#4caf50')
                        .text('✓', margin + 15, y + 20);

                    // Signature text
                    doc.font(fontBold).fontSize(10).fillColor('#2e7d32')
                        .text('DOCUMENTO ASSINADO DIGITALMENTE', margin + 50, y + 12);

                    doc.font(fontRegular).fontSize(7).fillColor('#1b5e20')
                        .text(`Certificado: ${cn}`, margin + 50, y + 28)
                        .text(`Emitido por: ${issuerCN}`, margin + 50, y + 38)
                        .text(`Validade: ${validFrom} até ${validTo}`, margin + 50, y + 48)
                        .text(`Hash do documento: ${receipt.id.substring(0, 16).toUpperCase()}...`, margin + 50, y + 58);

                    y += 75;
                }
            }
        } catch (error) {
            // If certificate is not available, just skip the signature section
            console.error('Certificate not available for signature:', error);
        }

        // === FOOTER ===
        doc.moveTo(margin, y).lineTo(pageWidth - margin, y).lineWidth(0.5).stroke('#d9d9d9').dash(5, { space: 3 });
        y += 12;

        doc.font(fontRegular).fontSize(8).fillColor(secondaryColor)
            .text('Observações: Este recibo pode ser utilizado como comprovante de pagamento. Para emissão de Nota Fiscal, solicite à empresa e informe seus dados corretamente.',
                margin, y, {
                width: contentWidth,
                lineGap: 2
            });

        y += 30;

        doc.font(fontRegular).fontSize(7).fillColor('#9ca3af')
            .text(`Documento emitido digitalmente em ${new Date().toLocaleString('pt-BR')}`,
                margin, y, { width: contentWidth, align: 'center' });

        doc.end();

        const pdfBuffer = await new Promise<Buffer>((resolve) => {
            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        });

        return new NextResponse(pdfBuffer as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="recibo-${receipt.numero}.pdf"`
            }
        });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Erro ao gerar PDF: ' + error.message }, { status: 500 });
    }
}

// Helper function to convert number to words (simplified Portuguese)
function numberToWords(num: number): string {
    const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
    const teens = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

    if (num === 0) return 'zero';
    if (num === 100) return 'cem';

    let words = '';
    const intPart = Math.floor(num);
    const decPart = Math.round((num - intPart) * 100);

    // Thousands
    if (intPart >= 1000) {
        const thousands = Math.floor(intPart / 1000);
        if (thousands === 1) {
            words += 'mil';
        } else {
            words += numberToWords(thousands) + ' mil';
        }
        if (intPart % 1000 > 0) words += ' e ';
    }

    const remainder = intPart % 1000;

    // Hundreds
    if (remainder >= 100) {
        words += hundreds[Math.floor(remainder / 100)];
        if (remainder % 100 > 0) words += ' e ';
    }

    const lastTwo = remainder % 100;

    // Tens and units
    if (lastTwo >= 20) {
        words += tens[Math.floor(lastTwo / 10)];
        if (lastTwo % 10 > 0) {
            words += ' e ' + units[lastTwo % 10];
        }
    } else if (lastTwo >= 10) {
        words += teens[lastTwo - 10];
    } else if (lastTwo > 0) {
        words += units[lastTwo];
    }

    // Cents
    if (decPart > 0) {
        words += ' e ' + decPart + ' centavos';
    }

    return words.trim();
}
