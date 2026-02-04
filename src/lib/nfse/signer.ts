import { SignedXml } from "xml-crypto";
import forge from "node-forge";
import { readFileSync } from "fs";

interface SignatureOptions {
    pfxPath: string;
    passphrase: string;
    referenceXPath: string; // Ex: "//*[local-name(.)='infDPS']"
}

function extractPemFromPfx(pfxPath: string, passphrase: string) {
    const p12Der = readFileSync(pfxPath, { encoding: "binary" });
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, passphrase);

    // Cert (cadeia)
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })?.[forge.pki.oids.certBag];
    const cert = certBags?.[0]?.cert;
    if (!cert) throw new Error("Não encontrei CERT no PFX.");

    // Private key
    const keyBags =
        p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })?.[forge.pki.oids.pkcs8ShroudedKeyBag] ||
        p12.getBags({ bagType: forge.pki.oids.keyBag })?.[forge.pki.oids.keyBag];

    const keyObj = keyBags?.[0]?.key;
    if (!keyObj) throw new Error("Não encontrei CHAVE PRIVADA no PFX.");

    const certPem = forge.pki.certificateToPem(cert);
    const keyPem = forge.pki.privateKeyToPem(keyObj as forge.pki.PrivateKey);

    return { certPem, keyPem };
}

export function signXmlWithPfx(xmlString: string, options: SignatureOptions) {
    const { pfxPath, passphrase, referenceXPath } = options;
    const { certPem, keyPem } = extractPemFromPfx(pfxPath, passphrase);

    const sig = new SignedXml({
        privateKey: keyPem,
        publicCert: certPem,
        canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#",
        signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"
    });

    sig.addReference({
        xpath: referenceXPath,
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
        transforms: [
            "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
            "http://www.w3.org/2001/10/xml-exc-c14n#"
        ],
        isEmptyUri: true,
    });

    sig.computeSignature(xmlString, {
        location: { reference: referenceXPath, action: "append" },
    });

    return sig.getSignedXml();
}
