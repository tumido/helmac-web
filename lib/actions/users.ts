"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import argon2 from "argon2";
import { db } from "@/lib/db";
import { auth, requireSuperAdmin } from "@/lib/auth";
import { createUserSchema, updateUserSchema } from "@/lib/validators/user";

export type UserActionState = {
    error?: {
        email?: string[];
        name?: string[];
        password?: string[];
        confirmPassword?: string[];
        role?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createUser(
    prevState: UserActionState,
    formData: FormData
): Promise<UserActionState> {
    try {
        await requireSuperAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        email: formData.get("email"),
        name: formData.get("name"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
        role: formData.get("role"),
    };

    const validated = createUserSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Check if email already exists
        const existing = await db.user.findUnique({
            where: { email: validated.data.email },
        });

        if (existing) {
            return { error: { email: ["Uživatel s tímto emailem již existuje"] } };
        }

        // Hash password
        const passwordHash = await argon2.hash(validated.data.password);

        await db.user.create({
            data: {
                email: validated.data.email,
                name: validated.data.name,
                passwordHash,
                role: validated.data.role,
            },
        });

        revalidatePath("/admin/uzivatele");
    } catch (error) {
        console.error("Failed to create user:", error);
        return { error: { _form: ["Nepodařilo se vytvořit uživatele"] } };
    }

    redirect("/admin/uzivatele");
}

export async function updateUser(
    userId: string,
    prevState: UserActionState,
    formData: FormData
): Promise<UserActionState> {
    try {
        await requireSuperAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        email: formData.get("email"),
        name: formData.get("name"),
        password: formData.get("password") || undefined,
        confirmPassword: formData.get("confirmPassword") || undefined,
        role: formData.get("role"),
    };

    const validated = updateUserSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        const user = await db.user.findUnique({ where: { id: userId } });

        if (!user) {
            return { error: { _form: ["Uživatel nenalezen"] } };
        }

        // Check if email conflicts with another user
        if (validated.data.email && validated.data.email !== user.email) {
            const existing = await db.user.findUnique({
                where: { email: validated.data.email },
            });

            if (existing) {
                return { error: { email: ["Uživatel s tímto emailem již existuje"] } };
            }
        }

        // Prepare update data
        const updateData: {
            email?: string;
            name?: string;
            passwordHash?: string;
            role?: "SUPER_ADMIN" | "ADMIN" | "EDITOR";
        } = {
            email: validated.data.email,
            name: validated.data.name,
            role: validated.data.role,
        };

        // Hash new password if provided
        if (validated.data.password && validated.data.password.length > 0) {
            updateData.passwordHash = await argon2.hash(validated.data.password);
        }

        await db.user.update({
            where: { id: userId },
            data: updateData,
        });

        revalidatePath("/admin/uzivatele");
        revalidatePath(`/admin/uzivatele/${userId}`);
    } catch (error) {
        console.error("Failed to update user:", error);
        return { error: { _form: ["Nepodařilo se upravit uživatele"] } };
    }

    redirect("/admin/uzivatele");
}

export async function deleteUser(userId: string) {
    try {
        await requireSuperAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    // Get current user to prevent self-deletion
    const session = await auth();
    if (session?.user?.id === userId) {
        return { error: "Nemůžete smazat sami sebe" };
    }

    try {
        const user = await db.user.findUnique({ where: { id: userId } });

        if (!user) {
            return { error: "Uživatel nenalezen" };
        }

        // Check if user has created news
        const newsCount = await db.news.count({
            where: { authorId: userId },
        });

        if (newsCount > 0) {
            return {
                error: `Nelze smazat uživatele, který vytvořil ${newsCount} novinek. Nejprve smažte nebo převeďte novinky.`,
            };
        }

        await db.user.delete({
            where: { id: userId },
        });

        revalidatePath("/admin/uzivatele");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { error: "Nepodařilo se smazat uživatele" };
    }
}
