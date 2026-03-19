"use server";

import { db } from "@/lib/db";
import { setPublicSession } from "@/lib/public-auth";

export interface VerifyEmailResult {
    success: boolean;
    message: string;
}

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
    if (!token) {
        return { success: false, message: "Chybí ověřovací token" };
    }

    const verificationToken = await db.emailVerificationToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!verificationToken) {
        return { success: false, message: "Neplatný ověřovací odkaz" };
    }

    if (verificationToken.usedAt) {
        return { success: false, message: "Tento odkaz již byl použit" };
    }

    if (verificationToken.expiresAt < new Date()) {
        return { success: false, message: "Platnost odkazu vypršela. Nechte si zaslat nový." };
    }

    // Mark token as used and verify user
    await db.$transaction([
        db.emailVerificationToken.update({
            where: { id: verificationToken.id },
            data: { usedAt: new Date() },
        }),
        db.publicUser.update({
            where: { id: verificationToken.userId },
            data: {
                emailVerified: true,
                emailVerifiedAt: new Date(),
            },
        }),
    ]);

    // Set session cookie now that email is verified
    await setPublicSession({
        id: verificationToken.user.id,
        email: verificationToken.user.email,
    });

    return { success: true, message: "Email byl úspěšně ověřen" };
}
