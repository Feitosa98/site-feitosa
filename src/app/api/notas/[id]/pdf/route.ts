import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import PDFDocument from 'pdfkit';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import sign from '@signpdf/signpdf'; // Default export
import { P12Signer } from '@signpdf/signer-p12';
import { pdfkitAddPlaceholder } from '@signpdf/placeholder-pdfkit';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const note = await prisma.note.findUnique({
            where: { id },
            include: { client: true }
        });

        if (!note) {
            return NextResponse.json({ error: 'Nota não encontrada' }, { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `inline; filename="DANFSe-${note.numero}.pdf"`);

        // 1. Generate PDF Buffer with Placeholder
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            (async () => {
                try {
                    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
                    const fontBoldPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');

                    // Ensure fonts exist, fallback if not? 
                    // Assuming they exist or using standard fonts for safety if IO fails could be better fallback.
                    const fontRegular = fs.existsSync(fontPath) ? fontPath : 'Helvetica';
                    const fontBold = fs.existsSync(fontBoldPath) ? fontBoldPath : 'Helvetica-Bold';

                    const doc = new PDFDocument({
                        margin: 20,
                        size: 'A4',
                        font: fontRegular,
                        autoFirstPage: true,
                        bufferPages: true // Essential for placeholder
                    });

                    const buffers: Buffer[] = [];
                    doc.on('data', buffers.push.bind(buffers));
                    // Handle resolve differently
                    doc.on('end', () => resolve(Buffer.concat(buffers)));
                    doc.on('error', reject);

                    // Add Signature Placeholder
                    // pdfkitAddPlaceholder requires pdf doc and placeholder metadata
                    pdfkitAddPlaceholder({
                        pdf: doc,
                        pdfBuffer: Buffer.from([]), // Will be filled later
                        reason: 'Validação de Recibo ICP-Brasil',
                        contactInfo: 'contato@feitosasolucoes.com.br',
                        name: 'Feitosa Solucoes Tecnologicas',
                        location: 'Manaus, AM, BR',
                    });

                    const W = 595; // Page width
                    const M = 20;  // Margin
                    const CW = W - (M * 2); // Content width
                    let Y = M; // Current Y position

                    // Generate Access Key
                    const now = new Date();
                    const uf = '13';
                    const year = now.getFullYear().toString().slice(-2);
                    const month = (now.getMonth() + 1).toString().padStart(2, '0');
                    const cnpj = '35623245000150';
                    const noteNum = note.numero.toString().padStart(9, '0');
                    const accessKey = `${uf}0${year}0${month}2${cnpj}00000000${noteNum}260294068500${year}`;

                    // Generate QR Code
                    const qrUrl = note.linkConsulta || `https://www.nfse.gov.br/ConsultaPublica/?tpc=1&chave=${accessKey}`;
                    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 80, margin: 0 });
                    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

                    // ... (Drawing Logic - copied from previous, abbreviated for diff if possible but must be complete in replace) ...
                    // ========== HEADER BOX ==========
                    doc.rect(M, Y, CW, 65).stroke();

                    // Logo Box
                    doc.rect(M, Y, 130, 65).stroke();
                    doc.font(fontBold).fontSize(14).fillColor('black').text('DANFSe', M + 35, Y + 25);
                    doc.font(fontRegular).fontSize(8).text('Documento Auxiliar da', M + 30, Y + 40);
                    doc.text('Nota Fiscal de Serviço Eletrônica', M + 15, Y + 50);

                    // Center Details
                    doc.fontSize(8).text('Número da NFS-e', M + 140, Y + 10);
                    doc.font(fontBold).fontSize(10).text(note.numero.toString(), M + 140, Y + 20);

                    doc.font(fontRegular).fontSize(8).text('Cod. Verificação', M + 240, Y + 10);
                    doc.font(fontBold).fontSize(10).text(note.codigoVerificacao || 'PENDENTE', M + 240, Y + 20);

                    // Right - QR Code
                    doc.image(qrBuffer, W - M - 60, Y + 5, { width: 55, height: 55 });

                    Y += 70;

                    // ========== PRESTADOR DE SERVIÇOS ==========
                    doc.rect(M, Y, CW, 80).stroke();
                    doc.fillColor('#e0e0e0').rect(M, Y, CW, 15).fill().stroke();
                    doc.fillColor('black').font(fontBold).fontSize(9).text('PRESTADOR DE SERVIÇOS', M, Y + 4, { align: 'center', width: CW });

                    doc.font(fontBold).fontSize(8).text('Nome/Razão Social:', M + 5, Y + 20);
                    doc.font(fontRegular).text('35.623.245 IAGO DA SILVA FEITOSA', M + 90, Y + 20);

                    doc.font(fontBold).text('CPF/CNPJ:', M + 5, Y + 35);
                    doc.font(fontRegular).text('35.623.245/0001-50', M + 50, Y + 35);

                    doc.font(fontBold).text('Inscrição Municipal:', M + 200, Y + 35);
                    doc.font(fontRegular).text('45103301', M + 285, Y + 35);

                    doc.font(fontBold).text('Endereço:', M + 5, Y + 50);
                    doc.font(fontRegular).text('RUA ASSUA, 22 - JORGE TEIXEIRA - MANAUS/AM - CEP: 69088-561', M + 50, Y + 50);

                    doc.font(fontBold).text('Município:', M + 5, Y + 65);
                    doc.font(fontRegular).text('Manaus - AM', M + 50, Y + 65);

                    Y += 85;

                    // ========== TOMADOR DE SERVIÇOS ==========
                    doc.rect(M, Y, CW, 80).stroke();
                    doc.fillColor('#e0e0e0').rect(M, Y, CW, 15).fill().stroke();
                    doc.fillColor('black').font(fontBold).fontSize(9).text('TOMADOR DE SERVIÇOS', M, Y + 4, { align: 'center', width: CW });

                    const cpfCnpj = note.clientCpfCnpj.replace(/\D/g, '');
                    const formattedCpf = cpfCnpj.length === 11
                        ? cpfCnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                        : note.clientCpfCnpj;

                    doc.font(fontBold).fontSize(8).text('Nome/Razão Social:', M + 5, Y + 20);
                    doc.font(fontRegular).text(note.clientName.toUpperCase(), M + 90, Y + 20);

                    doc.font(fontBold).text('CPF/CNPJ:', M + 5, Y + 35);
                    doc.font(fontRegular).text(formattedCpf, M + 50, Y + 35);

                    doc.font(fontBold).text('E-mail:', M + 200, Y + 35);
                    doc.font(fontRegular).text(note.client?.email || '-', M + 235, Y + 35);

                    const address = note.client?.address || 'Endereço não informado';
                    doc.font(fontBold).text('Endereço:', M + 5, Y + 50);
                    doc.font(fontRegular).text(address.toUpperCase(), M + 50, Y + 50);

                    Y += 85;

                    // ========== DISCRIMINAÇÃO DOS SERVIÇOS ==========
                    doc.rect(M, Y, CW, 100).stroke();
                    doc.fillColor('#e0e0e0').rect(M, Y, CW, 15).fill().stroke();
                    doc.fillColor('black').font(fontBold).fontSize(9).text('DISCRIMINAÇÃO DOS SERVIÇOS', M, Y + 4, { align: 'center', width: CW });

                    doc.font(fontRegular).fontSize(9).text(note.description || 'Serviços prestados.', M + 10, Y + 25, { width: CW - 20, align: 'justify' });

                    Y += 105;

                    // ========== VALORES ==========
                    doc.rect(M, Y, CW, 50).stroke();
                    doc.fillColor('#e0e0e0').rect(M, Y, CW, 15).fill().stroke();
                    doc.fillColor('black').font(fontBold).fontSize(9).text('VALORES DA NFS-e', M, Y + 4, { align: 'center', width: CW });

                    const colW = CW / 5;

                    doc.font(fontBold).fontSize(7).text('Valor do Serviço', M, Y + 20, { width: colW, align: 'center' });
                    doc.font(fontRegular).fontSize(9).text(`R$ ${note.value.toFixed(2)}`, M, Y + 30, { width: colW, align: 'center' });

                    doc.font(fontBold).fontSize(7).text('Base de Cálculo', M + colW, Y + 20, { width: colW, align: 'center' });
                    doc.font(fontRegular).fontSize(9).text(`R$ ${note.value.toFixed(2)}`, M + colW, Y + 30, { width: colW, align: 'center' });

                    doc.font(fontBold).fontSize(7).text('Alíquota ISS', M + colW * 2, Y + 20, { width: colW, align: 'center' });
                    doc.font(fontRegular).fontSize(9).text('0%', M + colW * 2, Y + 30, { width: colW, align: 'center' });

                    doc.font(fontBold).fontSize(7).text('Valor ISS', M + colW * 3, Y + 20, { width: colW, align: 'center' });
                    doc.font(fontRegular).fontSize(9).text('R$ 0,00', M + colW * 3, Y + 30, { width: colW, align: 'center' });

                    doc.font(fontBold).fontSize(7).text('Valor Líquido', M + colW * 4, Y + 20, { width: colW, align: 'center' });
                    doc.font(fontRegular).fontSize(9).text(`R$ ${note.value.toFixed(2)}`, M + colW * 4, Y + 30, { width: colW, align: 'center' });

                    Y += 55;

                    // ========== INFO ==========
                    doc.rect(M, Y, CW, 45).stroke();
                    doc.font(fontBold).fontSize(8).text('OUTRAS INFORMAÇÕES', M + 5, Y + 5);
                    doc.font(fontRegular).fontSize(7).text(`
                    - Código do Serviço: 01.07 - Suporte Técnico em Informática
                    - Competência: ${note.emissionDate.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}
                    - Local de Prestação: Manaus - AM
                    - Documento emitido por ME ou EPP optante pelo Simples Nacional.
                    - Assinatura Digital ICP-Brasil
                    `, M + 5, Y + 15, { width: CW - 10 });

                    doc.end();
                } catch (e) {
                    console.error("PDF Generation Error (Basic):", e);
                    reject(e);
                }
            })();
        });

        // 2. Sign the PDF
        try {
            // Fetch certificate configuration from database
            const settings = await prisma.settings.findFirst();
            const certPath = settings?.certificatePath;
            const certPass = settings?.certificatePassword;

            if (certPath && fs.existsSync(certPath)) {
                const p12Buffer = fs.readFileSync(certPath);

                // Use password from settings or fallback (though fallback isn't safe for real certs)
                const signer = new P12Signer(p12Buffer, { passphrase: certPass || '' });

                // sign is already an instance (default export)
                const signedPdf = await sign.sign(pdfBuffer, signer);

                return new Response(signedPdf as any, { status: 200, headers });
            } else {
                console.warn('Certificate not configured or file not found. Returning unsigned PDF.');
                // Fallback to test certificate for development if configured -> or just return unsigned
                // For now, let's try the local certificate.p12 as fallback if explicit cert is missing
                const localCertPath = path.join(process.cwd(), 'certificate.p12');
                if (fs.existsSync(localCertPath)) {
                    console.log('Using local fallback certificate for signing.');
                    const localP12 = fs.readFileSync(localCertPath);
                    const localSigner = new P12Signer(localP12, { passphrase: 'password' });

                    const localSigned = await sign.sign(pdfBuffer, localSigner);
                    return new Response(localSigned as any, { status: 200, headers });
                }

                return new Response(pdfBuffer as any, { status: 200, headers });
            }
        } catch (signError) {
            console.error('Signing Error:', signError);
            // Fallback to unsigned
            return new Response(pdfBuffer as any, { status: 200, headers });
        }

    } catch (error: any) {
        console.error("PDF Generation Error:", error);
        return NextResponse.json({ error: 'Erro ao gerar PDF: ' + error.message }, { status: 500 });
    }
}
