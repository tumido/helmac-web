const FIO_API_BASE = "https://fioapi.fio.cz/v1/rest";

// Custom error classes
export class FioApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
    ) {
        super(message);
        this.name = "FioApiError";
    }
}

export class FioRateLimitError extends FioApiError {
    constructor() {
        super("Fio API rate limit exceeded (max 1 request per 30 seconds per token)", 409);
        this.name = "FioRateLimitError";
    }
}

// Parsed transaction from Fio API response
export interface ParsedBankTransaction {
    fioTransactionId: string;
    date: Date;
    amount: number;
    currency: string;
    counterpartAccount: string | null;
    variableSymbol: string | null;
    counterpartName: string | null;
    userMessage: string | null;
}

// Raw Fio API response types
interface FioColumnValue {
    value: unknown;
    name: string;
    id: number;
}

interface FioTransaction {
    column0?: FioColumnValue;  // date
    column1?: FioColumnValue;  // amount
    column2?: FioColumnValue;  // counterpart account
    column3?: FioColumnValue;  // counterpart bank code
    column5?: FioColumnValue;  // variable symbol
    column7?: FioColumnValue;  // user identification
    column10?: FioColumnValue; // counterpart name
    column14?: FioColumnValue; // currency
    column16?: FioColumnValue; // user message
    column22?: FioColumnValue; // transaction ID
}

interface FioApiResponse {
    accountStatement: {
        info: {
            accountId: string;
            bankId: string;
            currency: string;
            dateStart: string;
            dateEnd: string;
        };
        transactionList: {
            transaction: FioTransaction[] | null;
        };
    };
}

function parseTransaction(tx: FioTransaction): ParsedBankTransaction | null {
    const txId = tx.column22?.value;
    if (txId == null) return null;

    const dateStr = tx.column0?.value;
    const amount = tx.column1?.value;

    if (dateStr == null || amount == null) return null;

    const counterpartAccount = tx.column2?.value;
    const counterpartBankCode = tx.column3?.value;
    const fullAccount = counterpartAccount
        ? counterpartBankCode
            ? `${counterpartAccount}/${counterpartBankCode}`
            : String(counterpartAccount)
        : null;

    return {
        fioTransactionId: String(txId),
        date: new Date((dateStr as string).replace(/[+-]\d{4}$/, "")),
        amount: Number(amount),
        currency: tx.column14?.value ? String(tx.column14.value) : "CZK",
        counterpartAccount: fullAccount,
        variableSymbol: tx.column5?.value ? String(tx.column5.value) : null,
        counterpartName: tx.column10?.value ? String(tx.column10.value) : null,
        userMessage: tx.column16?.value ? String(tx.column16.value) : null,
    };
}

async function fetchFioApi(url: string): Promise<FioApiResponse> {
    // Log URL without token (replace token segment with ***)
    const safeUrl = url.replace(/\/rest\/(.+?)\/[A-Za-z0-9]{10,}\//, "/rest/$1/***/");
    console.log("[fio-api] Fetching:", safeUrl);

    const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
    });

    console.log("[fio-api] Response status:", response.status);

    if (response.status === 409) {
        throw new FioRateLimitError();
    }

    if (!response.ok) {
        const body = await response.text();
        console.error("[fio-api] Error response body:", body);
        throw new FioApiError(
            `Fio API returned ${response.status}: ${response.statusText}`,
            response.status,
        );
    }

    const data: FioApiResponse = await response.json();

    const info = data.accountStatement?.info;
    const txCount = data.accountStatement?.transactionList?.transaction?.length ?? 0;
    console.log("[fio-api] Response info:", JSON.stringify({
        accountId: info?.accountId,
        dateStart: info?.dateStart,
        dateEnd: info?.dateEnd,
        currency: info?.currency,
        transactionCount: txCount,
    }));

    return data;
}

function parseTransactions(data: FioApiResponse): ParsedBankTransaction[] {
    const transactions = data.accountStatement.transactionList.transaction;
    if (!transactions) return [];

    const parsed: ParsedBankTransaction[] = [];
    for (const tx of transactions) {
        const result = parseTransaction(tx);
        if (result) {
            parsed.push(result);
        }
    }
    return parsed;
}

/**
 * Fetch transactions since the last download cursor.
 * This is the primary method — Fio remembers the cursor position per token.
 */
export async function fetchLastTransactions(token: string): Promise<ParsedBankTransaction[]> {
    const url = `${FIO_API_BASE}/last/${token}/transactions.json`;
    const data = await fetchFioApi(url);
    return parseTransactions(data);
}

/**
 * Fetch transactions for a specific date range.
 */
export async function fetchTransactionsByDateRange(
    token: string,
    from: Date,
    to: Date,
): Promise<ParsedBankTransaction[]> {
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const url = `${FIO_API_BASE}/periods/${token}/${formatDate(from)}/${formatDate(to)}/transactions.json`;
    const data = await fetchFioApi(url);
    return parseTransactions(data);
}

/**
 * Set the "last download" cursor to a specific date.
 * Call this when enabling sync for the first time.
 */
export async function setLastDate(token: string, date: Date): Promise<void> {
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const dateStr = formatDate(date);
    const url = `${FIO_API_BASE}/set-last-date/${token}/${dateStr}/`;

    console.log("[fio-api] Setting last-date cursor to:", dateStr);

    const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
    });

    console.log("[fio-api] set-last-date response status:", response.status);

    if (response.status === 409) {
        throw new FioRateLimitError();
    }

    if (!response.ok) {
        const body = await response.text();
        console.error("[fio-api] set-last-date error body:", body);
        throw new FioApiError(
            `Fio API set-last-date returned ${response.status}: ${response.statusText}`,
            response.status,
        );
    }
}
