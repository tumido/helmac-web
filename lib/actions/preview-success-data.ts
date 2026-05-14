"use server";

import { z } from "zod";
import { requireEditor } from "@/lib/auth";
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
import {
    czechAccountToIBAN,
    formatCzechAccount,
    generateSPAYD,
} from "@/lib/utils/spayd";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import { buildVisibleFieldIds } from "@/lib/utils/visible-fields";
import type { PaymentData } from "@/lib/actions/public/registration";

const PREVIEW_VARIABLE_SYMBOL = "00000000";
const PREVIEW_SUCCESS_MESSAGE = "Děkujeme za vaši registraci.";

const submissionDataSchema = z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
);

const additionalPersonSchema = z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
);

const previewSuccessSchema = z.object({
    yearId: z.string().min(1),
    submissionData: submissionDataSchema,
    additionalPeople: z
        .array(additionalPersonSchema)
        .max(MAX_ADDITIONAL_PEOPLE)
        .default([]),
});

export type GetPreviewSuccessDataInput = z.input<typeof previewSuccessSchema>;

export type PreviewSuccessResult =
    | {
          success: true;
          totalPrice: number | null;
          variableSymbol: string;
          paymentData: PaymentData | null;
          message: string;
      }
    | { error: string };

export async function getPreviewSuccessData(
    input: GetPreviewSuccessDataInput,
): Promise<PreviewSuccessResult> {
    try {
        await requireEditor();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const parsed = previewSuccessSchema.safeParse(input);
    if (!parsed.success) {
        return { error: "Neplatná data" };
    }

    const { yearId, submissionData, additionalPeople } = parsed.data;

    const year = await db.year.findUnique({
        where: { id: yearId },
        select: { id: true },
    });
    if (!year) {
        return { error: "Ročník nenalezen" };
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

    const typedAP: AdditionalPersonData[] =
        additionalPeople as AdditionalPersonData[];

    const visibleFieldIds = buildVisibleFieldIds(
        formDataStored.fields,
        formDataStored.conditions,
        submissionData,
        allFields,
        formDataStored.pricingDefinitions,
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
            formDataStored.pricingDefinitions,
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
    const iban =
        globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
            ? czechAccountToIBAN(
                  globalBank.bankAccountNumber,
                  globalBank.bankAccountBankCode,
                  globalBank.bankAccountPrefix ?? undefined,
              )
            : null;

    let paymentData: PaymentData | null = null;
    if (totalPrice && totalPrice > 0 && iban && bankAccount) {
        const spaydString = generateSPAYD({
            iban,
            amount: totalPrice,
            variableSymbol: PREVIEW_VARIABLE_SYMBOL,
        });
        paymentData = {
            totalAmount: totalPrice,
            variableSymbol: PREVIEW_VARIABLE_SYMBOL,
            bankAccount,
            iban,
            swift: globalBank?.bankSwift ?? null,
            spaydString,
        };
    }

    return {
        success: true,
        totalPrice,
        variableSymbol: PREVIEW_VARIABLE_SYMBOL,
        paymentData,
        message: PREVIEW_SUCCESS_MESSAGE,
    };
}
