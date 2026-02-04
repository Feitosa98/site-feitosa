import { Agent, request as undiciRequest } from "undici";
import { readFileSync } from "fs";

const isProd = process.env.NFSE_ENV === "prod";

const BASE_URL = isProd
    ? "https://adn.nfse.gov.br/contribuintes/v1"
    : "https://adn.producaorestrita.nfse.gov.br/contribuintes/v1";

// Cache do agente para não ler o PFX a cada request
let agentInstance: Agent | null = null;

function getAgent() {
    if (agentInstance) return agentInstance;

    const pfxPath = process.env.CERT_PFX_PATH;
    const passphrase = process.env.CERT_PFX_PASS;

    if (!pfxPath || !passphrase) {
        throw new Error("Certificado PFX não configurado (.env)");
    }

    agentInstance = new Agent({
        connect: {
            pfx: readFileSync(pfxPath),
            passphrase: passphrase,
            rejectUnauthorized: false // Ambiente de homologação as vezes tem cert auto-assinado
        },
        keepAliveTimeout: 10000,
        keepAliveMaxTimeout: 10000
    });

    return agentInstance;
}

export async function emitirNfse(xmlAssinado: string) {
    const url = `${BASE_URL}/nfse`; // Endpoint hipotético padrão nacional
    const agent = getAgent();

    const { statusCode, body } = await undiciRequest(url, {
        method: "POST",
        body: xmlAssinado,
        headers: {
            "Content-Type": "application/xml",
            "Accept": "application/xml"
        },
        dispatcher: agent
    });

    const respText = await body.text();

    if (statusCode >= 400) {
        throw new Error(`Erro NFSe (${statusCode}): ${respText}`);
    }

    return respText;
}

export async function consultarNfse(chaveAcesso: string) {
    const url = `${BASE_URL}/nfse/${encodeURIComponent(chaveAcesso)}`;
    const agent = getAgent();

    const { statusCode, body } = await undiciRequest(url, {
        method: "GET",
        headers: {
            "Accept": "application/xml"
        },
        dispatcher: agent
    });

    const respText = await body.text();

    if (statusCode >= 400) {
        throw new Error(`Erro Consulta (${statusCode}): ${respText}`);
    }

    return respText;
}
