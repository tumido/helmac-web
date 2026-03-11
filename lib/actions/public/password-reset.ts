"use server";

import { db } from "@/lib/db";
import argon2 from "argon2";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { requestPasswordResetSchema, resetPasswordSchema } from "@/lib/validators/public-user";
import { sendPasswordResetEmail } from "@/lib/utils/email";

export interface PasswordResetActionState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}

export async function requestPasswordReset(
    prevState: PasswordResetActionState | null,
    formData: FormData,
): Promise<PasswordResetActionState> {
    const rawData = {
        email: formData.get("email"),
    };

    const validated = requestPasswordResetSchema.safeParse(rawData);
    if (!validated.success) {
        return {
            success: false,
            message: "Zadejte platný email",
            errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    const email = validated.data.email.toLowerCase();

    // Always return success to prevent email enumeration
    const user = await db.publicUser.findUnique({
        where: { email },
        select: { id: true, email: true },
    });

    if (user) {
        const token = crypto.randomUUID();
        await db.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            },
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const resetUrl = `${baseUrl}/obnoveni-hesla?token=${token}`;

        sendPasswordResetEmail({ to: user.email, resetUrl }).catch((err) => {
            console.error("Failed to send password reset email:", err);
        });
    }

    return {
        success: true,
        message: "Pokud účet s tímto emailem existuje, odeslali jsme vám odkaz pro obnovení hesla.",
    };
}

export async function resetPassword(
    prevState: PasswordResetActionState | null,
    formData: FormData,
): Promise<PasswordResetActionState> {
    const rawData = {
        token: formData.get("token"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    };

    const validated = resetPasswordSchema.safeParse(rawData);
    if (!validated.success) {
        return {
            success: false,
            message: "Opravte chyby ve formuláři",
            errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    const resetToken = await db.passwordResetToken.findUnique({
        where: { token: validated.data.token },
        include: { user: true },
    });

    if (!resetToken) {
        return { success: false, message: "Neplatný odkaz pro obnovení hesla" };
    }

    if (resetToken.usedAt) {
        return { success: false, message: "Tento odkaz již byl použit" };
    }

    if (resetToken.expiresAt < new Date()) {
        return { success: false, message: "Platnost odkazu vypršela. Požádejte o nový." };
    }

    const passwordHash = await argon2.hash(validated.data.password);

    await db.$transaction([
        db.passwordResetToken.update({
            where: { id: resetToken.id },
            data: { usedAt: new Date() },
        }),
        db.publicUser.update({
            where: { id: resetToken.userId },
            data: { passwordHash },
        }),
    ]);

    redirect("/prihlaseni?reset=true");
}
