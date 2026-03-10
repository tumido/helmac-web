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

export const updateBankAccountSchema = z.object({
    bankAccountPrefix: z
        .string()
        .regex(/^\d{0,6}$/, "Předčíslí může obsahovat max. 6 číslic")
        .optional()
        .nullable()
        .transform((v) => v || null),
    bankAccountNumber: z
        .string()
        .regex(/^\d{1,10}$/, "Číslo účtu musí obsahovat 1-10 číslic")
        .optional()
        .nullable()
        .transform((v) => v || null),
    bankAccountBankCode: z
        .string()
        .regex(/^\d{4}$/, "Kód banky musí obsahovat přesně 4 číslice")
        .optional()
        .nullable()
        .transform((v) => v || null),
}).superRefine((data, ctx) => {
    const hasAny = data.bankAccountPrefix || data.bankAccountNumber || data.bankAccountBankCode;
    if (hasAny) {
        if (!data.bankAccountNumber) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Číslo účtu je povinné",
                path: ["bankAccountNumber"],
            });
        }
        if (!data.bankAccountBankCode) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Kód banky je povinný",
                path: ["bankAccountBankCode"],
            });
        }
    }
});
