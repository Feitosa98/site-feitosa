export interface PixData {
    pixKey: string;
    merchantName: string;
    merchantCity: string;
    txId: string;
    amount: string;
}

export function buildPixPayload(data: PixData): string {
    // PIX EMV payload format
    const payloadFormatIndicator = '000201';

    // Point of Initiation Method: 12 = Dynamic QR Code (optional, but 11 for static is common)
    // For simplicity, we use the standard static structure often used for business keys

    const merchantAccountInfo = `0014br.gov.bcb.pix01${data.pixKey.length.toString().padStart(2, '0')}${data.pixKey}`;
    const merchantCategoryCode = '52040000';
    const transactionCurrency = '5303986';
    const transactionAmount = `54${data.amount.length.toString().padStart(2, '0')}${data.amount}`;
    const countryCode = '5802BR';
    const merchantName = `59${data.merchantName.length.toString().padStart(2, '0')}${data.merchantName.substring(0, 25).toUpperCase()}`;
    const merchantCity = `60${data.merchantCity.length.toString().padStart(2, '0')}${data.merchantCity.substring(0, 15).toUpperCase()}`;

    // txId must be simple characters for wide compatibility
    const cleanTxId = data.txId.replace(/[^Z0-9]/gi, '').substring(0, 25);
    const additionalDataField = `62${(cleanTxId.length + 4).toString().padStart(2, '0')}05${cleanTxId.length.toString().padStart(2, '0')}${cleanTxId}`;

    const payload = payloadFormatIndicator + merchantAccountInfo + merchantCategoryCode +
        transactionCurrency + transactionAmount + countryCode + merchantName +
        merchantCity + additionalDataField + '6304';

    // Calculate CRC16
    const crc = calculateCRC16(payload);
    return payload + crc;
}

function calculateCRC16(str: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
        }
    }
    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}
