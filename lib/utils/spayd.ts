/**
 * Converts Czech bank account (number + bankCode) to IBAN.
 * Czech IBAN = "CZ" + 2 check digits + 4-digit bankCode + 16-digit account (zero-padded).
 */
export function czechAccountToIBAN(
    accountNumber: string,
    bankCode: string,
    prefix?: string,
): string | null {
    const cleanPrefix = (prefix ?? "").replace(/\s/g, "");
    const cleanNumber = accountNumber.replace(/\s/g, "");
    const cleanBank = bankCode.replace(/\s/g, "");

    if (!/^\d{0,6}$/.test(cleanPrefix)) return null;
    if (!/^\d{1,10}$/.test(cleanNumber)) return null;
    if (!/^\d{4}$/.test(cleanBank)) return null;

    const paddedPrefix = cleanPrefix.padStart(6, "0");
    const paddedNumber = cleanNumber.padStart(10, "0");
    const bban = cleanBank + paddedPrefix + paddedNumber;

    // MOD 97: BBAN + "CZ00" where C=12, Z=35
    const numericString = bban + "123500";
    const remainder = mod97(numericString);
    const checkDigits = String(98 - remainder).padStart(2, "0");

    return `CZ${checkDigits}${bban}`;
}

function mod97(numStr: string): number {
    let remainder = 0;
    for (const ch of numStr) {
        remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
    }
    return remainder;
}

/**
 * Generates SPAYD (Short Payment Descriptor) string for Czech QR payments.
 */
export function generateSPAYD(params: {
    iban: string;
    amount: number;
    variableSymbol?: string;
    message?: string;
}): string {
    const parts = [
        "SPD*1.0",
        `ACC:${params.iban}`,
        `AM:${params.amount.toFixed(2)}`,
        "CC:CZK",
    ];

    if (params.variableSymbol) {
        parts.push(`X-VS:${params.variableSymbol}`);
    }

    if (params.message) {
        const sanitized = params.message.replace(/\*/g, "").substring(0, 60);
        parts.push(`MSG:${sanitized}`);
    }

    return parts.join("*");
}

export function formatCzechAccount(
    accountNumber: string,
    bankCode: string,
    prefix?: string,
): string {
    if (prefix) {
        return `${prefix}-${accountNumber}/${bankCode}`;
    }
    return `${accountNumber}/${bankCode}`;
}
