import { z } from "zod";

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
