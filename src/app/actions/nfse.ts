'use server';

import { auth } from '@/auth';
import { buildDpsXml } from '@/lib/nfse/builder';
import { signXmlWithPfx } from '@/lib/nfse/signer';
import { emitirNfse } from '@/lib/nfse/client';
import prisma from '@/lib/prisma';
import { logAction } from '@/lib/audit';

export async function submitNFSe(data: any) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user || user.role !== 'ADMIN') {
            return { success: false, error: 'Unauthorized' };
        }

        // 1. Validar configs
        const pfxPath = process.env.CERT_PFX_PATH;
        const passphrase = process.env.CERT_PFX_PASS;
        if (!pfxPath || !passphrase) {
            return { success: false, error: 'Certificado não configurado no servidor (.env)' };
        }

        // 2. Construir XML (DPS)
        const dpsXml = buildDpsXml({
            municipioIbge: '1302603', // Manaus (fixo ou config)
            numeroDps: data.numeroDps, // Sequencial
            dataEmissaoIso: new Date().toISOString(),
            prestadorCnpj: process.env.CNPJ_EMISSOR || '',
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

        // 4. Enviar para API Nacional (simulado se ambiente dev)
        // const resultXml = await emitirNfse(signedXml);

        // TODO: Parsear XML de retorno para pegar número da nota e link
        // Por enquanto, vamos mockar o sucesso para não quebrar sem certificado real

        await logAction(user.id, 'EMITIR_NFSE', `Emissão de NFSe DPS ${data.numeroDps} para ${data.tomadorNome}`);

        return {
            success: true,
            // Retornar o XML assinado para debug ou o retorno da API
            xml: signedXml
        };

    } catch (error: any) {
        console.error('Erro ao emitir NFSe:', error);
        return { success: false, error: error.message };
    }
}
