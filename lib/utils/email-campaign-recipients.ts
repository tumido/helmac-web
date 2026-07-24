import { db } from "@/lib/db";
import { buildPlaceholders } from "@/lib/utils/email";
import { czechAccountToIBAN, formatCzechAccount } from "@/lib/utils/spayd";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import { getOrdersForYear, getFormStructure } from "@/lib/services/v2";
import type { RecipientFilter } from "@/lib/validators/email-campaign";

export interface ResolvedRecipient {
    email: string;
    orderId: string;
    placeholders: Record<string, string>;
}

/**
 * Resolve campaign recipients from the v2 orders of a year. Reads the email
 * address from the form's email field, builds per-recipient placeholder maps
 * from each order's primary registrant, and dedupes by lowercased email (first
 * registration wins).
 */
export async function resolveCampaignRecipients(
    yearId: string,
    filter: RecipientFilter,
): Promise<ResolvedRecipient[]> {
    const structure = await getFormStructure(yearId);
    if (!structure) return [];

    const emailField = structure.fields.find((f) => f.type === "email");
    if (!emailField) return [];

    // Checkbox values are stored in v2 as "true"/"false" strings; convert them
    // back to real booleans so buildPlaceholders renders "Ano"/"Ne" as before.
    const checkboxFields = new Set(
        structure.fields
            .filter((f) => f.type === "checkbox")
            .map((f) => f.name),
    );

    const year = await db.year.findUnique({
        where: { id: yearId },
        select: { year: true, title: true, subtitle: true },
    });
    if (!year) return [];

    const globalBank = await getGlobalBankAccount();
    const bankAccount =
        globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
            ? formatCzechAccount(
                  globalBank.bankAccountNumber,
                  globalBank.bankAccountBankCode,
                  globalBank.bankAccountPrefix ?? undefined,
              )
            : null;
    const iban =
        globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
            ? czechAccountToIBAN(
                  globalBank.bankAccountNumber,
                  globalBank.bankAccountBankCode,
                  globalBank.bankAccountPrefix ?? undefined,
              )
            : null;

    const orders = await getOrdersForYear(yearId, { isTest: false });

    const seen = new Set<string>();
    const recipients: ResolvedRecipient[] = [];

    // getOrdersForYear returns newest-first; iterate oldest-first so dedupe
    // keeps the first registration for a given email.
    for (let i = orders.length - 1; i >= 0; i--) {
        const order = orders[i];

        if (!filter.statuses.includes(order.status as RecipientFilter["statuses"][number])) {
            continue;
        }
        if (filter.paid === "paid" && !order.isPaid) continue;
        if (filter.paid === "unpaid" && order.isPaid) continue;

        const primary = order.people.find((p) => p.personIndex === 0);
        if (!primary) continue;

        const email = String(primary.values[emailField.name] ?? "")
            .trim()
            .toLowerCase();
        if (!email || seen.has(email)) continue;
        seen.add(email);

        const submissionData: Record<string, unknown> = { ...primary.values };
        for (const name of checkboxFields) {
            const raw = submissionData[name];
            if (typeof raw === "string") {
                submissionData[name] = raw === "true";
            }
        }

        const placeholders = buildPlaceholders({
            submissionData,
            variableSymbol: order.variableSymbol,
            totalPrice: order.totalPrice,
            bankAccount,
            iban,
            swift: globalBank?.bankSwift ?? null,
            yearNumber: year.year,
            yearTitle: year.title,
            yearSubtitle: year.subtitle,
        });

        recipients.push({
            email,
            orderId: order.id,
            placeholders,
        });
    }

    return recipients;
}
