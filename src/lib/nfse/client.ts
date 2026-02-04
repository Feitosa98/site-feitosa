import { Agent, request as undiciRequest } from "undici";
import { readFileSync } from "fs";

export interface NFSeConfig {
    pfxPath?: string;
    pfxPassword?: string;
    environment?: 'producao' | 'homologacao';
}

function getBaseUrl(config?: NFSeConfig) {
    // Default to env or homolog if not specified
    const env = config?.environment || (process.env.NFSE_ENV === 'prod' ? 'producao' : 'homologacao');

    return env === 'producao'
        ? "https://adn.nfse.gov.br/contribuintes/v1"
        : "https://adn.producaorestrita.nfse.gov.br/contribuintes/v1";
}

function getDanfseUrl(config?: NFSeConfig) {
    const env = config?.environment || (process.env.NFSE_ENV === 'prod' ? 'producao' : 'homologacao');

    return env === 'producao'
        ? "https://adn.nfse.gov.br"
        : "https://adn.producaorestrita.nfse.gov.br";
}

let agentInstance: Agent | null = null;
let lastConfigHash: string = "";

function getAgent(config?: NFSeConfig) {
    const pfxPath = config?.pfxPath || process.env.CERT_PFX_PATH;
    const passphrase = config?.pfxPassword || process.env.CERT_PFX_PASS;

    if (!pfxPath || !passphrase) {
        throw new Error("Certificado PFX não configurado");
    }

    // Simple hash to detect config change
    const currentHash = `${pfxPath}:${passphrase}`;

    if (agentInstance && lastConfigHash === currentHash) {
        return agentInstance;
    }

    agentInstance = new Agent({
        connect: {
            pfx: readFileSync(pfxPath),
            passphrase: passphrase,
            rejectUnauthorized: false
        },
        keepAliveTimeout: 10000,
        keepAliveMaxTimeout: 10000
    });

    lastConfigHash = currentHash;
    return agentInstance;
}

export async function emitirNfse(xmlAssinado: string, config?: NFSeConfig) {
    const url = `${getBaseUrl(config)}/nfse`;
    const agent = getAgent(config);

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

export async function consultarNfse(chaveAcesso: string, config?: NFSeConfig) {
    const url = `${getBaseUrl(config)}/nfse/${encodeURIComponent(chaveAcesso)}`;
    const agent = getAgent(config);

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

export async function baixarDanfsePdf(chaveAcesso: string, config?: NFSeConfig) {
    const url = `${getDanfseUrl(config)}/danfse/${encodeURIComponent(chaveAcesso)}`;
    const agent = getAgent(config);

    const { statusCode, headers, body } = await undiciRequest(url, {
        method: "GET",
        headers: {
            "Accept": "application/pdf"
        },
        dispatcher: agent
    });

    if (statusCode >= 400) {
        const errText = await body.text();
        throw new Error(`DANFSe erro ${statusCode}: ${errText}`);
    }

    const contentType = headers["content-type"] || "";
    if (typeof contentType === 'string' && !contentType.includes("pdf")) {
        const txt = await body.text();
        throw new Error(`Resposta não-PDF (${contentType}): ${txt}`);
    }

    return Buffer.from(await body.arrayBuffer());
}
