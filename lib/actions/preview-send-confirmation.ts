"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { migrateFormData } from "@/lib/utils/form-migration";
import {
    getAllFields,
    getAllInputFields,
    MAX_ADDITIONAL_PEOPLE,
} from "@/lib/types/registration-form";
import type {
    AdditionalPersonData,
    RegistrationFormData,
} from "@/lib/types/registration-form";
import { computePricingSummary } from "@/lib/utils/pricing-summary";
import { czechAccountToIBAN, formatCzechAccount } from "@/lib/utils/spayd";
import {
    appendConditionalSections,
    buildPlaceholders,
    generateQRPaymentImage,
    replacePlaceholders,
    sendConfirmationEmail,
} from "@/lib/utils/email";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import { buildVisibleFieldIds } from "@/lib/utils/visible-fields";

const PREVIEW_VARIABLE_SYMBOL = "00000000";

const submissionDataSchema = z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
);

const additionalPersonSchema = z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
);

const sendPreviewSchema = z.object({
    yearId: z.string().min(1),
    submissionData: submissionDataSchema,
    additionalPeople: z.array(additionalPersonSchema).max(MAX_ADDITIONAL_PEOPLE).default([]),
});

export type SendPreviewConfirmationInput = z.input<typeof sendPreviewSchema>;

export async function sendPreviewConfirmation(
    input: SendPreviewConfirmationInput,
): Promise<{ success?: true; error?: string }> {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const parsed = sendPreviewSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Neplatná data" };
    }

    const { yearId, submissionData, additionalPeople } = parsed.data;

    const year = await db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            subtitle: true,
            confirmationEmailEnabled: true,
            confirmationEmailSubject: true,
            confirmationEmailBody: true,
            confirmationEmailBcc: true,
            confirmationEmailAccountId: true,
            confirmationEmailSections: true,
        },
    });

    if (!year) {
        return { error: "Ročník nenalezen" };
    }

    if (
        !year.confirmationEmailEnabled ||
        !year.confirmationEmailSubject ||
        !year.confirmationEmailBody
    ) {
        return { error: "Potvrzovací email není zapnutý nebo nakonfigurovaný" };
    }

    const preview = await db.formPreview.findUnique({ where: { yearId } });
    if (!preview) {
        return { error: "Náhled formuláře nenalezen" };
    }

    const formDataStored = migrateFormData(
        preview.data as unknown as RegistrationFormData,
    );
    const allFields = getAllFields(formDataStored.fields);
    const allInputFields = getAllInputFields(formDataStored.fields);

    const emailField = allInputFields.find((f) => f.type === "email");
    if (!emailField) {
        return { error: "Formulář neobsahuje pole pro email" };
    }
    const recipientEmail = String(submissionData[emailField.name] ?? "").trim();
    if (!recipientEmail) {
        return { error: "Vyplňte emailovou adresu" };
    }

    const typedAP: AdditionalPersonData[] = additionalPeople as AdditionalPersonData[];

    const visibleFieldIds = buildVisibleFieldIds(
        formDataStored.fields,
        formDataStored.conditions,
        submissionData,
        allFields,
    );

    const apVisibleFieldIdsPerPerson = typedAP.map((person) => {
        const merged: Record<string, unknown> = { ...submissionData };
        for (const [key, value] of Object.entries(person)) {
            merged[key] = value;
        }
        return buildVisibleFieldIds(
            formDataStored.fields,
            formDataStored.conditions,
            merged,
            allFields,
        );
    });

    const pricingSummary = computePricingSummary({
        pricingDefinitions: formDataStored.pricingDefinitions,
        priceTiers: formDataStored.priceTiers ?? [],
        allInputFields,
        submissionData,
        additionalPeople: typedAP,
        visibleFieldIds,
        apVisibleFieldIdsPerPerson,
    });
    const totalPrice = pricingSummary?.totalPrice ?? null;

    const globalBank = await getGlobalBankAccount();
    const bankAccount =
        globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
            ? formatCzechAccount(
                  globalBank.bankAccountNumber,
                  globalBank.bankAccountBankCode,
                  globalBank.bankAccountPrefix ?? undefined,
              )
            : null;

    const rawSubmissionForPlaceholders: Record<string, unknown> = { ...submissionData };
    if (typedAP.length > 0) {
        rawSubmissionForPlaceholders.additionalPeople = typedAP;
    }

    const placeholders = buildPlaceholders({
        submissionData: rawSubmissionForPlaceholders,
        variableSymbol: PREVIEW_VARIABLE_SYMBOL,
        totalPrice,
        bankAccount,
        yearNumber: year.year,
        yearTitle: year.title,
        yearSubtitle: year.subtitle,
    });

    const renderedSubject = replacePlaceholders(
        year.confirmationEmailSubject,
        placeholders,
    );
    const bodyWithSections = appendConditionalSections({
        body: year.confirmationEmailBody,
        sections:
            (year.confirmationEmailSections as unknown as EmailConditionalSection[]) ??
            [],
        rawSubmissionData: rawSubmissionForPlaceholders,
        allFields,
    });
    const renderedBody = replacePlaceholders(bodyWithSections, placeholders);

    let qrImageBuffer: Buffer | null = null;
    if (
        totalPrice &&
        totalPrice > 0 &&
        globalBank?.bankAccountNumber &&
        globalBank?.bankAccountBankCode
    ) {
        const iban = czechAccountToIBAN(
            globalBank.bankAccountNumber,
            globalBank.bankAccountBankCode,
            globalBank.bankAccountPrefix ?? undefined,
        );
        if (iban) {
            qrImageBuffer = await generateQRPaymentImage({
                iban,
                amount: totalPrice,
                variableSymbol: PREVIEW_VARIABLE_SYMBOL,
            });
        }
    }

    try {
        const sent = await sendConfirmationEmail({
            to: recipientEmail,
            subject: renderedSubject,
            body: renderedBody,
            bcc: year.confirmationEmailBcc ?? undefined,
            qrImageBuffer: qrImageBuffer ?? undefined,
            accountId: year.confirmationEmailAccountId,
        });

        if (!sent) {
            return { error: "Nepodařilo se odeslat email" };
        }
        return { success: true };
    } catch (error) {
        console.error("Failed to send preview confirmation email:", error);
        return { error: "Nepodařilo se odeslat email" };
    }
}
