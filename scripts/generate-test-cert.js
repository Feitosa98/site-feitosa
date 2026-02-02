const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

console.log('Generating Self-Signed Certificate for Testing...');

// Generate Keypair
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();

cert.publicKey = keys.publicKey;
cert.serialNumber = '01';
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [{
    name: 'commonName',
    value: 'FEITOSA SOLUCOES TECNOLOGICAS'
}, {
    name: 'countryName',
    value: 'BR'
}, {
    shortName: 'ST',
    value: 'AM'
}, {
    name: 'localityName',
    value: 'Manaus'
}, {
    name: 'organizationName',
    value: 'Feitosa Solucoes'
}, {
    shortName: 'OU',
    value: 'TI'
}];

cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey); // Self-signed

const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keys.privateKey, [cert], 'password' // Password is 'password'
);

const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
const p12Buffer = Buffer.from(p12Der, 'binary');

const outPath = path.join(__dirname, '..', 'certificate.p12');
fs.writeFileSync(outPath, p12Buffer);

console.log(`Certificate generated at ${outPath}`);
console.log('Password: password');
