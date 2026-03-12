"use server";

import { db } from "@/lib/db";
import argon2 from "argon2";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { publicRegisterSchema, publicLoginSchema } from "@/lib/validators/public-user";
import { setPublicSession, clearPublicSession, getPublicSession } from "@/lib/public-auth";
import { sendVerificationEmail } from "@/lib/utils/email";
import { getBaseUrl } from "@/lib/utils/url";

export interface AuthActionState {
    success: boolean;
    message: string;
    errors?: Record<string, string[]>;
}

export async function publicRegister(
    prevState: AuthActionState | null,
    formData: FormData,
): Promise<AuthActionState> {
    const rawData = {
        email: formData.get("email"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    };

    const validated = publicRegisterSchema.safeParse(rawData);
    if (!validated.success) {
        return {
            success: false,
            message: "Opravte chyby ve formuláři",
            errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    const email = validated.data.email.toLowerCase();

    // Check if email already exists
    const existing = await db.publicUser.findUnique({
        where: { email },
        select: { id: true, emailVerified: true },
    });

    if (existing && existing.emailVerified) {
        return {
            success: false,
            message: "Účet s tímto emailem již existuje",
            errors: { email: ["Účet s tímto emailem již existuje"] },
        };
    }

    const passwordHash = await argon2.hash(validated.data.password);

    // Update existing unverified account or create new user
    const user = existing
        ? await db.publicUser.update({
            where: { id: existing.id },
            data: { passwordHash },
        })
        : await db.publicUser.create({
            data: {
                email,
                passwordHash,
            },
        });

    // Create verification token
    const token = crypto.randomUUID();
    await db.emailVerificationToken.create({
        data: {
            token,
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
    });

    // Link existing registrations by email
    await linkExistingRegistrations(user.id, email);

    // Send verification email
    const verificationUrl = `${getBaseUrl()}/overeni-emailu?token=${token}`;
    try {
        await sendVerificationEmail({ to: email, verificationUrl });
    } catch (err) {
        console.error("Failed to send verification email:", err);
    }

    // Set session immediately (unverified)
    await setPublicSession({
        id: user.id,
        email: user.email,
        emailVerified: false,
    });

    redirect("/overeni-emailu?pending=true");
}

export async function publicLogin(
    prevState: AuthActionState | null,
    formData: FormData,
): Promise<AuthActionState> {
    const rawData = {
        email: formData.get("email"),
        password: formData.get("password"),
    };

    const validated = publicLoginSchema.safeParse(rawData);
    if (!validated.success) {
        return {
            success: false,
            message: "Opravte chyby ve formuláři",
            errors: validated.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    const email = validated.data.email.toLowerCase();

    const user = await db.publicUser.findUnique({
        where: { email },
        select: { id: true, email: true, passwordHash: true, emailVerified: true },
    });

    if (!user) {
        return {
            success: false,
            message: "Nesprávný email nebo heslo",
        };
    }

    const passwordValid = await argon2.verify(user.passwordHash, validated.data.password);
    if (!passwordValid) {
        return {
            success: false,
            message: "Nesprávný email nebo heslo",
        };
    }

    await setPublicSession({
        id: user.id,
        email: user.email,
        emailVerified: user.emailVerified,
    });

    if (!user.emailVerified) {
        redirect("/overeni-emailu?pending=true");
    }

    redirect("/ucet");
}

export async function publicLogout(): Promise<void> {
    await clearPublicSession();
    redirect("/");
}

export async function resendVerification(): Promise<AuthActionState> {
    const session = await getPublicSession();
    if (!session) {
        return { success: false, message: "Nejste přihlášeni" };
    }

    const user = await db.publicUser.findUnique({
        where: { id: session.sub },
        select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
        return { success: false, message: "Uživatel nenalezen" };
    }

    if (user.emailVerified) {
        return { success: false, message: "Email je již ověřen" };
    }

    // Create new verification token
    const token = crypto.randomUUID();
    await db.emailVerificationToken.create({
        data: {
            token,
            userId: user.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
    });

    const verificationUrl = `${getBaseUrl()}/overeni-emailu?token=${token}`;

    const sent = await sendVerificationEmail({ to: user.email, verificationUrl });
    if (!sent) {
        return { success: false, message: "Nepodařilo se odeslat email" };
    }

    return { success: true, message: "Ověřovací email byl odeslán" };
}

/**
 * Link existing RegistrationSubmission records to a newly created PublicUser
 * by matching email in the JSON data field.
 */
async function linkExistingRegistrations(userId: string, email: string): Promise<void> {
    try {
        // Find all registration forms to get email field names
        const forms = await db.registrationForm.findMany({
            select: { id: true, fields: true },
        });

        for (const form of forms) {
            // Find the email field name in this form
            const fields = form.fields as unknown as { fields: Array<{ type?: string; name?: string; children?: Array<{ type?: string; name?: string }> }> };
            let emailFieldName: string | null = null;

            const findEmailField = (elements: Array<{ type?: string; name?: string; children?: Array<{ type?: string; name?: string }> }>) => {
                for (const el of elements) {
                    if (el.type === "email" && el.name) {
                        emailFieldName = el.name;
                        return;
                    }
                    if (el.children) {
                        findEmailField(el.children);
                    }
                }
            };

            if (fields && Array.isArray(fields.fields)) {
                findEmailField(fields.fields);
            }

            if (!emailFieldName) continue;

            // Update matching submissions
            await db.registrationSubmission.updateMany({
                where: {
                    formId: form.id,
                    publicUserId: null,
                    data: {
                        path: [emailFieldName],
                        equals: email,
                    },
                },
                data: { publicUserId: userId },
            });
        }
    } catch (error) {
        console.error("Failed to link existing registrations:", error);
    }
}
