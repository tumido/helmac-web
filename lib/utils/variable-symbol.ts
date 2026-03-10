import { randomInt } from "crypto";
import { db } from "@/lib/db";

const MAX_RETRIES = 5;
const MIN_VALUE = 1_000_000_000; // 10 digits
const MAX_VALUE = 10_000_000_000; // exclusive upper bound

/**
 * Generates a unique 10-digit numeric variable symbol for bank transfers.
 * Checks uniqueness against the database; retries up to 5 times on collision.
 */
export async function generateUniqueVariableSymbol(): Promise<string> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const symbol = String(randomInt(MIN_VALUE, MAX_VALUE));

        const existing = await db.registrationSubmission.findUnique({
            where: { variableSymbol: symbol },
            select: { id: true },
        });

        if (!existing) {
            return symbol;
        }
    }

    throw new Error("Failed to generate unique variable symbol after maximum retries");
}
