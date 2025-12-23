import { z } from "zod";

export const createUserSchema = z
    .object({
        email: z
            .string()
            .min(1, "Email je povinny")
            .email("Neplatny format emailu"),
        name: z
            .string()
            .min(1, "Jmeno je povinne")
            .max(100, "Jmeno je prilis dlouhe"),
        password: z
            .string()
            .min(8, "Heslo musi mit alespon 8 znaku")
            .max(100, "Heslo je prilis dlouhe"),
        confirmPassword: z.string(),
        role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"], {
            message: "Neplatna role",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Hesla se neshoduji",
        path: ["confirmPassword"],
    });

export const updateUserSchema = z
    .object({
        email: z
            .string()
            .min(1, "Email je povinny")
            .email("Neplatny format emailu")
            .optional(),
        name: z
            .string()
            .min(1, "Jmeno je povinne")
            .max(100, "Jmeno je prilis dlouhe")
            .optional(),
        password: z
            .string()
            .min(8, "Heslo musi mit alespon 8 znaku")
            .max(100, "Heslo je prilis dlouhe")
            .optional()
            .or(z.literal("")),
        confirmPassword: z.string().optional().or(z.literal("")),
        role: z
            .enum(["SUPER_ADMIN", "ADMIN", "EDITOR"], {
                message: "Neplatna role",
            })
            .optional(),
    })
    .refine(
        (data) => {
            if (data.password && data.password.length > 0) {
                return data.password === data.confirmPassword;
            }
            return true;
        },
        {
            message: "Hesla se neshoduji",
            path: ["confirmPassword"],
        }
    );

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
