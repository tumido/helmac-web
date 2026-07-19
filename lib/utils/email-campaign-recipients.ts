import { db } from "@/lib/db";
import { buildPlaceholders } from "@/lib/utils/email";
import { czechAccountToIBAN, formatCzechAccount } from "@/lib/utils/spayd";
import { migrateFormData } from "@/lib/utils/form-migration";
import {
    getAllInputFields,
    isInputField,
} from "@/lib/types/registration-form";
import type { InputField, PricingDefinition } from "@/lib/types/registration-form";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import { resolveSubmissionDataForDisplay } from "@/lib/utils/pricing-display";
import type { RecipientFilter } from "@/lib/validators/email-campaign";
import type { RegistrationStatus } from "@prisma/client";

export interface ResolvedRecipient {
    email: string;
    submissionId: string;
    placeholders: Record<string, string>;
}

/**
 * Resolve campaign recipients from registration submissions of a year.
 * Extracts the address from the form's email field, builds per-recipient
 * placeholder maps, and dedupes by lowercased email (first submission wins).
 */
export async function resolveCampaignRecipients(
    yearId: string,
    filter: RecipientFilter,
): Promise<ResolvedRecipient[]> {
    const submissions = await db.registrationSubmission.findMany({
        where: {
            yearId,
            isTest: false,
            status: { in: filter.statuses as RegistrationStatus[] },
            ...(filter.paid === "paid" ? { isPaid: true } : {}),
            ...(filter.paid === "unpaid" ? { isPaid: false } : {}),
        },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            formId: true,
            data: true,
            variableSymbol: true,
            totalPrice: true,
            year: { select: { year: true, title: true, subtitle: true } },
        },
    });

    if (submissions.length === 0) return [];

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

    // Cache form fields per formId to avoid repeated DB lookups
    interface CachedForm {
        inputFields: InputField[];
        pricingDefinitions: PricingDefinition[];
    }
    const formFieldsCache = new Map<string, CachedForm>();

    async function getFormInputFields(formId: string): Promise<CachedForm> {
        const cached = formFieldsCache.get(formId);
        if (cached) return cached;
        const form = await db.registrationForm.findUnique({
            where: { id: formId },
            select: { fields: true },
        });
        const formData = form ? migrateFormData(form.fields) : null;
        const value: CachedForm = {
            inputFields: formData ? getAllInputFields(formData.fields) : [],
            pricingDefinitions: formData ? formData.pricingDefinitions : [],
        };
        formFieldsCache.set(formId, value);
        return value;
    }

    const seen = new Set<string>();
    const recipients: ResolvedRecipient[] = [];

    for (const submission of submissions) {
        const { inputFields, pricingDefinitions } = await getFormInputFields(
            submission.formId,
        );
        const emailField = inputFields.find(
            (f) => isInputField(f) && f.type === "email",
        );
        const submissionData = submission.data as Record<string, unknown>;
        const email = emailField
            ? String(submissionData[emailField.name] ?? "")
                  .trim()
                  .toLowerCase()
            : "";

        if (!email || seen.has(email)) continue;
        seen.add(email);

        const displaySubmissionData = resolveSubmissionDataForDisplay(
            submissionData,
            inputFields,
            pricingDefinitions,
        );
        const placeholders = buildPlaceholders({
            submissionData: displaySubmissionData,
            variableSymbol: submission.variableSymbol,
            totalPrice: submission.totalPrice,
            bankAccount,
            iban,
            swift: globalBank?.bankSwift ?? null,
            yearNumber: submission.year.year,
            yearTitle: submission.year.title,
            yearSubtitle: submission.year.subtitle,
        });

        recipients.push({
            email,
            submissionId: submission.id,
            placeholders,
        });
    }

    return recipients;
}
