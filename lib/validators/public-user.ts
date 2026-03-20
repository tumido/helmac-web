import { z } from "zod";

export const publicRegisterSchema = z.object({
    email: z.string().email("Neplatný email"),
    password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
    confirmPassword: z.string(),
    gdprConsent: z.literal(true, {
        message: "Musíte souhlasit se zpracováním osobních údajů",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Hesla se neshodují",
    path: ["confirmPassword"],
});

export const publicLoginSchema = z.object({
    email: z.string().email("Neplatný email"),
    password: z.string().min(1, "Zadejte heslo"),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Zadejte současné heslo"),
    newPassword: z.string().min(8, "Nové heslo musí mít alespoň 8 znaků"),
    confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Hesla se neshodují",
    path: ["confirmNewPassword"],
});

export const requestPasswordResetSchema = z.object({
    email: z.string().email("Neplatný email"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Hesla se neshodují",
    path: ["confirmPassword"],
});

export type PublicRegisterInput = z.infer<typeof publicRegisterSchema>;
export type PublicLoginInput = z.infer<typeof publicLoginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
