'use server';

import { auth } from '@/auth';
import { buildDpsXml } from '@/lib/nfse/builder';
import { signXmlWithPfx } from '@/lib/nfse/signer';
import { emitirNfse } from '@/lib/nfse/client';
import prisma from '@/lib/prisma';
import { logAction } from '@/lib/audit';

import { NFSeConfig } from '@/lib/nfse/client';

export async function submitNFSe(data: any) {
    try {
        const session = await auth();
        const user = session?.user as any;

        if (!user || user.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' };
        }

        // 1. Carregar configurações do Banco ou Env
        const settings = await prisma.settings.findUnique({ where: { id: 'settings' } });

        const pfxPath = settings?.certificatePath || process.env.CERT_PFX_PATH;
        const passphrase = settings?.certificatePassword || process.env.CERT_PFX_PASS;
        const environment = (settings?.environment === 'producao' ? 'producao' : 'homologacao') as 'producao' | 'homologacao'; // Default homolog

        if (!pfxPath || !passphrase) {
            return { success: false, error: 'Certificado não configurado (Acesse Configurações)' };
        }

        const nfseConfig: NFSeConfig = {
            pfxPath,
            pfxPassword: passphrase,
            environment
        };

        // 2. Construir XML (DPS)
        const dpsXml = buildDpsXml({
            municipioIbge: '1302603', // Manaus
            numeroDps: data.numeroDps,
            dataEmissaoIso: new Date().toISOString(),
            prestadorCnpj: process.env.CNPJ_EMISSOR || '', // TODO: Add to Settings as well?
            prestadorIM: process.env.IM_EMISSOR || '',

            tomadorTipo: data.tomadorCpfCnpj.length === 11 ? 'CPF' : 'CNPJ',
            tomadorDocumento: data.tomadorCpfCnpj.replace(/\D/g, ''),
            tomadorNome: data.tomadorNome,
            tomadorEndereco: {
                cep: data.endereco.cep.replace(/\D/g, ''),
                logradouro: data.endereco.logradouro,
                numero: data.endereco.numero,
                bairro: data.endereco.bairro,
                codigoMunicipioIbge: data.endereco.cidadeIbge || '1302603',
                uf: data.endereco.uf || 'AM'
            },

            descricaoServico: data.descricao,
            valorServicos: parseFloat(data.valor),
            aliquota: 0,
            valorIss: 0
        });

        // 3. Assinar XML
        const signedXml = signXmlWithPfx(dpsXml, {
            pfxPath,
            passphrase,
            referenceXPath: "//*[local-name(.)='infDPS']"
        });

        // 4. Enviar para API Nacional
        // const resultXml = await emitirNfse(signedXml, nfseConfig);

        // Mock success
        await logAction('EMITIR_NFSE', `Emissão de NFSe DPS ${data.numeroDps} para ${data.tomadorNome}`);

        return {
            success: true,
            xml: signedXml,
            chave: '1326021234567800019955001000000001000000001' // Mock
        };

    } catch (error: any) {
        console.error('Erro ao emitir NFSe:', error);
        return { success: false, error: error.message };
    }
}
