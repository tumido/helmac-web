import { z } from "zod";

export const createEmailAccountSchema = z.object({
    email: z
        .string()
        .email("Neplatná emailová adresa")
        .refine(
            (e) => e.endsWith("@seznam.cz") || e.endsWith("@email.cz"),
            "Email musí být @seznam.cz nebo @email.cz",
        ),
    password: z.string().min(1, "Heslo je povinné"),
    label: z.string().max(100, "Název je příliš dlouhý").optional().transform((v) => v || null),
    isMain: z.boolean().optional().default(false),
});

export const updateEmailAccountSchema = z.object({
    password: z.string().min(1, "Heslo je povinné").optional(),
    label: z.string().max(100, "Název je příliš dlouhý").optional().transform((v) => v || null),
    isMain: z.boolean().optional(),
});

export type CreateEmailAccountInput = z.infer<typeof createEmailAccountSchema>;
export type UpdateEmailAccountInput = z.infer<typeof updateEmailAccountSchema>;
