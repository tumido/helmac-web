import { z } from "zod";

export const createConditionalEmailSchema = z.object({
    name: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý"),
    conditionFieldId: z
        .string()
        .min(1, "Pole podmínky je povinné"),
    conditionFieldName: z
        .string()
        .min(1, "Název pole podmínky je povinný"),
    conditionValue: z
        .string()
        .min(1, "Hodnota podmínky je povinná"),
});

export const updateConditionalEmailTemplateSchema = z.object({
    confirmationEmailSubject: z
        .string()
        .min(1, "Předmět je povinný")
        .max(200, "Předmět je příliš dlouhý"),
    confirmationEmailBody: z
        .string()
        .min(1, "Text emailu je povinný")
        .max(50000, "Text emailu je příliš dlouhý"),
    confirmationEmailBcc: z
        .string()
        .email("Neplatný email pro BCC")
        .optional()
        .nullable()
        .transform((v) => v || null),
    emailAccountId: z
        .string()
        .cuid()
        .optional()
        .nullable()
        .transform((v) => v || null),
});

export type CreateConditionalEmailInput = z.infer<typeof createConditionalEmailSchema>;
export type UpdateConditionalEmailTemplateInput = z.infer<typeof updateConditionalEmailTemplateSchema>;
