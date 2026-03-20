import { z } from "zod";

export const createYearSchema = z.object({
    year: z.coerce
        .number()
        .min(2000, "Rok musi byt vetsi nez 2000")
        .max(2100, "Rok musi byt mensi nez 2100"),
    title: z
        .string()
        .min(1, "Nazev je povinny")
        .max(200, "Nazev je prilis dlouhy"),
    subtitle: z.string().max(500, "Podtitulek je prilis dlouhy").optional(),
    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    headerPhoto: z.string().max(500).optional().nullable(),
    heroPhoto: z.string().max(500).optional().nullable(),
});

export const updateYearSchema = createYearSchema.partial();

export type CreateYearInput = z.infer<typeof createYearSchema>;
export type UpdateYearInput = z.infer<typeof updateYearSchema>;

export const updateEmailTemplateSchema = z.object({
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
