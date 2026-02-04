
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';

const SETTINGS_ID = 'settings';

const DEFAULT_SETTINGS = {
    environment: 'homologacao',
    emailEnabled: false,
    emailAddress: '',
    whatsappEnabled: false,
    whatsappNumber: '',
    certificatePath: '',
    certificatePassword: ''
};

export async function testCertificate() {
    const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });

    if (!settings?.certificatePath || !fs.existsSync(settings.certificatePath)) {
        return { success: false, message: 'Certificado não encontrado. Faça o upload primeiro.' };
    }

    if (!settings.certificatePassword) {
        return { success: false, message: 'Senha do certificado não configurada.' };
    }

    try {
        // Read certificate file
        const pfxBuffer = fs.readFileSync(settings.certificatePath);
        const pfxBase64 = pfxBuffer.toString('base64');

        // Parse PFX to check password
        const forge = require('node-forge');
        const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(pfxBase64));

        // This line will throw if password is wrong
        forge.pkcs12.pkcs12FromAsn1(p12Asn1, settings.certificatePassword);

        return { success: true, message: 'Certificado Válido! Senha correta e arquivo acessível.' };
    } catch (e: any) {
        console.error('Certificate validation error:', e);

        // Debug info
        const fileStats = fs.statSync(settings.certificatePath);
        console.log(`Certificate file size: ${fileStats.size} bytes`);

        let errorMsg = e.message || 'Erro desconhecido';

        if (errorMsg.includes('PKCS#12 MAC could not be verified') || errorMsg.includes('Invalid password')) {
            return {
                success: false,
                message: `Senha incorreta ou formato incompatível. Detalhe: ${errorMsg}`
            };
        }

        return { success: false, message: `Erro técnico ao validar: ${errorMsg}` };
    }
}

export async function saveSettings(formData: FormData) {
    const currentSettings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } }) as { certificatePath?: string | null; certificatePassword?: string | null } | null ?? {};

    // Handle Certificate File
    const certFile = formData.get('certificateFile') as File | null;
    let certPath = currentSettings.certificatePath ?? null;

    if (certFile && certFile.size > 0 && certFile.name.endsWith('.pfx')) {
        const certsDir = path.join(process.cwd(), 'private', 'certs');
        if (!fs.existsSync(certsDir)) {
            fs.mkdirSync(certsDir, { recursive: true });
        }

        const buffer = Buffer.from(await certFile.arrayBuffer());
        const fileName = `cert_${Date.now()}.pfx`;
        const filePath = path.join(certsDir, fileName);

        fs.writeFileSync(filePath, buffer);
        certPath = filePath;
    }

    const data = {
        environment: formData.get('environment') as string,
        emailEnabled: formData.get('emailEnabled') === 'on',
        emailAddress: formData.get('emailAddress') as string,
        whatsappEnabled: formData.get('whatsappEnabled') === 'on',
        whatsappNumber: formData.get('whatsappNumber') as string,
        certificatePath: certPath,
        certificatePassword: formData.get('certificatePassword') as string || currentSettings.certificatePassword,
    };

    await prisma.settings.upsert({
        where: { id: SETTINGS_ID },
        update: data,
        create: { id: SETTINGS_ID, ...data }
    });

    let validationMsg = '';
    if (data.certificatePath && data.certificatePassword) {
        validationMsg = ' Configurações salvas. Validando certificado...';
    }

    revalidatePath('/admin/config');
    return { success: true, message: 'Configurações salvas com sucesso!' + validationMsg };
}

export async function getSettings() {
    const settings = await prisma.settings.findUnique({ where: { id: SETTINGS_ID } });
    return settings || DEFAULT_SETTINGS;
}
