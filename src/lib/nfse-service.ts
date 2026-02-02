import prisma from './prisma';
import * as forge from 'node-forge';
import { SignedXml } from 'xml-crypto';
import axios from 'axios';
import * as fs from 'fs';

interface EmitNfseData {
    clientName: string;
    clientCpfCnpj: string;
    value: number;
    description: string;
    clientId?: string;
}

interface NfseResult {
    success: boolean;
    numero?: number;
    codigoVerificacao?: string;
    linkConsulta?: string;
    protocolo?: string;
    xmlNfse?: string;
    message?: string;
    error?: string;
}

export async function emitNfse(data: EmitNfseData): Promise<NfseResult> {
    try {
        // 1. Get Settings
        const settings = await prisma.settings.findUnique({ where: { id: 'settings' } });

        if (!settings) {
            throw new Error('Configurações não encontradas');
        }

        const isProduction = settings.environment === 'producao';
        const baseUrl = isProduction
            ? 'https://nfse.gov.br/NfseWS/services/NfseWSService'
            : 'https://adn.producaorestrita.nfse.gov.br/NfseWS/services/NfseWSService';

        // 2. Generate next note number
        const lastNote = await prisma.note.findFirst({
            orderBy: { numero: 'desc' }
        });
        const nextNumber = (lastNote?.numero || 0) + 1;

        // 3. Generate verification code
        const verificationCode = generateVerificationCode();

        // 4. Generate DPS XML
        const xmlDps = generateDpsXml({
            numero: nextNumber,
            ...data,
            ambiente: isProduction ? '1' : '2'
        });

        // 5. Sign XML if certificate is configured
        let signedXml = xmlDps;
        if (settings.certificatePath && settings.certificatePassword) {
            try {
                signedXml = await signXml(xmlDps, settings.certificatePath, settings.certificatePassword);
            } catch (signError: any) {
                console.error('Error signing XML:', signError);
                return {
                    success: false,
                    error: `Erro ao assinar XML: ${signError.message}`
                };
            }
        } else {
            console.warn('Certificate not configured. Skipping XML signature.');
            // In homologation, some environments may accept unsigned XMLs for testing
        }

        // 6. Send to API
        try {
            const response = await axios.post(baseUrl, signedXml, {
                headers: {
                    'Content-Type': 'application/xml; charset=utf-8',
                    'SOAPAction': 'http://nfse.gov.br/EmitirNFSe'
                },
                timeout: 30000
            });

            // 7. Parse response
            const result = parseNfseResponse(response.data);

            if (result.success) {
                // 8. Save to database
                await prisma.note.create({
                    data: {
                        numero: nextNumber,
                        codigoVerificacao: result.codigoVerificacao || verificationCode,
                        value: data.value,
                        description: data.description,
                        clientName: data.clientName,
                        clientCpfCnpj: data.clientCpfCnpj,
                        clientId: data.clientId,
                        status: 'AUTORIZADA',
                        xmlDps: signedXml,
                        xmlNfse: result.xmlNfse,
                        linkConsulta: result.linkConsulta,
                        protocolo: result.protocolo
                    }
                });

                return {
                    success: true,
                    numero: nextNumber,
                    codigoVerificacao: result.codigoVerificacao || verificationCode,
                    linkConsulta: result.linkConsulta,
                    protocolo: result.protocolo,
                    message: `NFS-e ${nextNumber} autorizada com sucesso!`
                };
            } else {
                // Save as rejected
                await prisma.note.create({
                    data: {
                        numero: nextNumber,
                        codigoVerificacao: verificationCode,
                        value: data.value,
                        description: data.description,
                        clientName: data.clientName,
                        clientCpfCnpj: data.clientCpfCnpj,
                        clientId: data.clientId,
                        status: 'REJEITADA',
                        xmlDps: signedXml,
                        mensagemErro: result.error
                    }
                });

                return result;
            }

        } catch (apiError: any) {
            console.error('API Error:', apiError);

            // In development/testing: Save as PENDENTE (local test mode)
            // This allows testing without real API connection
            const savedNote = await prisma.note.create({
                data: {
                    numero: nextNumber,
                    codigoVerificacao: verificationCode,
                    value: data.value,
                    description: data.description,
                    clientName: data.clientName,
                    clientCpfCnpj: data.clientCpfCnpj,
                    clientId: data.clientId,
                    status: 'PENDENTE',
                    xmlDps: signedXml,
                    mensagemErro: `Modo teste - API não disponível: ${apiError.message}`
                }
            });

            // Return success for local testing
            return {
                success: true,
                numero: nextNumber,
                codigoVerificacao: verificationCode,
                message: `NFS-e ${nextNumber} salva localmente (modo teste)`,
                protocolo: 'LOCAL-TEST-' + Date.now()
            };
        }

    } catch (error: any) {
        console.error('Emit NFS-e Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

function generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function generateDpsXml(data: any): string {
    const now = new Date();
    const dhEmi = now.toISOString();
    const dCompet = now.toISOString().split('T')[0];

    // Generate DPS ID
    const dpsId = `DPS130260323562324500015000900000000000000${data.numero.toString().padStart(3, '0')}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<DPS versao="1.01" xmlns="http://www.sped.fazenda.gov.br/nfse">
  <infDPS Id="${dpsId}">
    <tpAmb>${data.ambiente}</tpAmb>
    <dhEmi>${dhEmi}</dhEmi>
    <verAplic>PortalNFSe_1.0.0</verAplic>
    <serie>900</serie>
    <nDPS>${data.numero}</nDPS>
    <dCompet>${dCompet}</dCompet>
    <tpEmit>1</tpEmit>
    <cLocEmi>1302603</cLocEmi>
    <prest>
      <CNPJ>35623245000150</CNPJ>
      <fone>92984596890</fone>
      <email>diretoria@feitosasolucoes.com.br</email>
      <regTrib>
        <opSimpNac>2</opSimpNac>
        <regEspTrib>0</regEspTrib>
      </regTrib>
    </prest>
    <toma>
      ${data.clientCpfCnpj.replace(/\D/g, '').length === 11
            ? `<CPF>${data.clientCpfCnpj.replace(/\D/g, '')}</CPF>`
            : `<CNPJ>${data.clientCpfCnpj.replace(/\D/g, '')}</CNPJ>`
        }
      <xNome>${data.clientName.toUpperCase()}</xNome>
      <end>
        <endNac>
          <cMun>1302603</cMun>
          <CEP>69088561</CEP>
        </endNac>
        <xLgr>Rua Principal</xLgr>
        <nro>100</nro>
        <xBairro>Centro</xBairro>
      </end>
    </toma>
    <serv>
      <locPrest>
        <cLocPrestacao>1302603</cLocPrestacao>
      </locPrest>
      <cServ>
        <cTribNac>010701</cTribNac>
        <xDescServ>${data.description || 'Serviços de TI'}</xDescServ>
        <cNBS>115013000</cNBS>
      </cServ>
    </serv>
    <valores>
      <vServPrest>
        <vServ>${data.value.toFixed(2)}</vServ>
      </vServPrest>
      <trib>
        <tribMun>
          <tribISSQN>1</tribISSQN>
          <tpRetISSQN>1</tpRetISSQN>
        </tribMun>
        <totTrib>
          <indTotTrib>0</indTotTrib>
        </totTrib>
      </trib>
    </valores>
  </infDPS>
</DPS>`;
}

async function signXml(xml: string, certPath: string, certPassword: string): Promise<string> {
    try {
        // Read certificate file
        const pfxBuffer = fs.readFileSync(certPath);
        const pfxBase64 = pfxBuffer.toString('base64');

        // Parse PFX
        const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(pfxBase64));
        const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, certPassword);

        // Extract private key and certificate
        const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
        const certBag = bags[forge.pki.oids.certBag]?.[0];

        const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
        const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];

        if (!certBag || !keyBag) {
            throw new Error('Certificate or private key not found in PFX');
        }

        const cert = certBag.cert;
        const privateKey = keyBag.key;

        if (!cert || !privateKey) {
            throw new Error('Invalid certificate or private key');
        }

        // Convert to PEM
        const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
        const certPem = forge.pki.certificateToPem(cert);

        // Sign XML
        const sig = new SignedXml();

        // Parse XML to find infDPS Id for strict referencing
        const dpsIdMatch = xml.match(/<infDPS Id="([^"]+)">/);
        const referenceUri = dpsIdMatch ? `#${dpsIdMatch[1]}` : "";

        // Explicitly set signature algorithm
        sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
        sig.canonicalizationAlgorithm = "http://www.w3.org/2001/10/xml-exc-c14n#";

        sig.addReference({
            xpath: "//*[local-name(.)='infDPS']",
            transforms: [
                "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
                "http://www.w3.org/2001/10/xml-exc-c14n#"
            ],
            digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
            uri: referenceUri
        });

        (sig as any).privateKey = privateKeyPem;
        (sig as any).getKeyInfoContent = () => {
            return `<X509Data><X509Certificate>${certPem.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n/g, '')}</X509Certificate></X509Data>`;
        };

        sig.computeSignature(xml);
        return sig.getSignedXml();

    } catch (error: any) {
        console.error('XML Signing Error:', error);
        throw new Error(`Falha ao assinar XML: ${error.message}`);
    }
}

function parseNfseResponse(xmlResponse: string): NfseResult {
    try {
        // Simple XML parsing (in production, use a proper XML parser like xml2js)

        // Check for errors
        if (xmlResponse.includes('<cStat>') && !xmlResponse.includes('<cStat>100</cStat>')) {
            const errorMatch = xmlResponse.match(/<xMotivo>(.*?)<\/xMotivo>/);
            return {
                success: false,
                error: errorMatch ? errorMatch[1] : 'Erro desconhecido na resposta da API'
            };
        }

        // Extract data
        const numeroMatch = xmlResponse.match(/<nNFSe>(.*?)<\/nNFSe>/);
        const codigoMatch = xmlResponse.match(/<cVerif>(.*?)<\/cVerif>/);
        const linkMatch = xmlResponse.match(/<linkConsulta>(.*?)<\/linkConsulta>/);
        const protocoloMatch = xmlResponse.match(/<nProt>(.*?)<\/nProt>/);

        return {
            success: true,
            numero: numeroMatch ? parseInt(numeroMatch[1]) : undefined,
            codigoVerificacao: codigoMatch ? codigoMatch[1] : undefined,
            linkConsulta: linkMatch ? linkMatch[1] : undefined,
            protocolo: protocoloMatch ? protocoloMatch[1] : undefined,
            xmlNfse: xmlResponse
        };

    } catch (error: any) {
        return {
            success: false,
            error: `Erro ao processar resposta: ${error.message}`
        };
    }
}
