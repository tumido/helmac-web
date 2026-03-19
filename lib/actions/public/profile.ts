"use server";

import { db } from "@/lib/db";
import argon2 from "argon2";
import { requirePublicAuth, setPublicSession } from "@/lib/public-auth";
import { changePasswordSchema } from "@/lib/validators/public-user";

export interface ProfileActionState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}

export async function changePassword(
    prevState: ProfileActionState | null,
    formData: FormData,
): Promise<ProfileActionState> {
    const session = await requirePublicAuth();

    const rawData = {
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
        confirmNewPassword: formData.get("confirmNewPassword"),
    };

    const validated = changePasswordSchema.safeParse(rawData);
    if (!validated.success) {
        return {
            success: false,
            message: "Opravte chyby ve formuláři",
            errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    const user = await db.publicUser.findUnique({
        where: { id: session.sub },
        select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
        return { success: false, message: "Uživatel nenalezen" };
    }

    const passwordValid = await argon2.verify(user.passwordHash, validated.data.currentPassword);
    if (!passwordValid) {
        return {
            success: false,
            message: "Současné heslo je nesprávné",
            errors: { currentPassword: ["Současné heslo je nesprávné"] },
        };
    }

    const newPasswordHash = await argon2.hash(validated.data.newPassword);
    await db.publicUser.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
    });

    // Refresh session
    await setPublicSession({
        id: user.id,
        email: user.email,
    });

    return { success: true, message: "Heslo bylo úspěšně změněno" };
}
