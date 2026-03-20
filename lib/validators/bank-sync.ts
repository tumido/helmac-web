import { z } from "zod";

export const fioTokenSchema = z.object({
    fioToken: z
        .string()
        .min(1, "Token je povinný")
        .regex(/^[a-zA-Z0-9]+$/, "Token může obsahovat pouze písmena a čísla")
        .length(64, "Token musí mít přesně 64 znaků"),
});

export const paymentEmailTemplateSchema = z.object({
    paymentEmailSubject: z
        .string()
        .min(1, "Předmět je povinný")
        .max(200, "Předmět je příliš dlouhý"),
    paymentEmailBody: z
        .string()
        .min(1, "Text emailu je povinný")
        .max(50000, "Text emailu je příliš dlouhý"),
    paymentEmailBcc: z
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
