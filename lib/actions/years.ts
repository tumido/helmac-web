"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createYearSchema, updateYearSchema, updateBankAccountSchema, updateEmailTemplateSchema } from "@/lib/validators/year";

export type YearActionState = {
    error?: {
        year?: string[];
        title?: string[];
        subtitle?: string[];
        startDate?: string[];
        endDate?: string[];
        headerPhoto?: string[];
        heroPhoto?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createYear(
    prevState: YearActionState,
    formData: FormData
): Promise<YearActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        year: formData.get("year"),
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        startDate: formData.get("startDate") || undefined,
        endDate: formData.get("endDate") || undefined,
        headerPhoto: formData.get("headerPhoto") || undefined,
        heroPhoto: formData.get("heroPhoto") || undefined,
    };

    const validated = createYearSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Check if year already exists
        const existing = await db.year.findUnique({
            where: { year: validated.data.year },
        });

        if (existing) {
            return { error: { year: ["Tento ročník již existuje"] } };
        }

        const year = await db.year.create({
            data: {
                year: validated.data.year,
                title: validated.data.title,
                subtitle: validated.data.subtitle,
                startDate: validated.data.startDate,
                endDate: validated.data.endDate,
                headerPhoto: validated.data.headerPhoto,
                heroPhoto: validated.data.heroPhoto,
            },
        });

        // Create default pages for new year
        await createDefaultPages(year.id);

        revalidatePath("/admin/rocniky");
    } catch (error) {
        console.error("Failed to create year:", error);
        return { error: { _form: ["Nepodařilo se vytvořit ročník"] } };
    }

    redirect("/admin/rocniky");
}

export async function updateYear(
    yearId: string,
    prevState: YearActionState,
    formData: FormData
): Promise<YearActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemáte oprávnění"] } };
    }

    const rawData = {
        year: formData.get("year"),
        title: formData.get("title"),
        subtitle: formData.get("subtitle") || undefined,
        startDate: formData.get("startDate") || undefined,
        endDate: formData.get("endDate") || undefined,
        headerPhoto: formData.get("headerPhoto") || undefined,
        heroPhoto: formData.get("heroPhoto") || undefined,
    };

    const validated = updateYearSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Check if changing year number and if it conflicts
        if (validated.data.year) {
            const existing = await db.year.findFirst({
                where: {
                    year: validated.data.year,
                    NOT: { id: yearId },
                },
            });

            if (existing) {
                return { error: { year: ["Tento ročník již existuje"] } };
            }
        }

        await db.year.update({
            where: { id: yearId },
            data: {
                year: validated.data.year,
                title: validated.data.title,
                subtitle: validated.data.subtitle,
                startDate: validated.data.startDate,
                endDate: validated.data.endDate,
                headerPhoto: validated.data.headerPhoto,
                heroPhoto: validated.data.heroPhoto,
            },
        });

        revalidatePath("/admin/rocniky");
        revalidatePath(`/admin/rocniky/${yearId}`);
        revalidatePath("/");
    } catch (error) {
        console.error("Failed to update year:", error);
        return { error: { _form: ["Nepodařilo se upravit ročník"] } };
    }

    redirect("/admin/rocniky");
}

export async function setActiveYear(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.$transaction([
            // Deactivate all years
            db.year.updateMany({
                data: { isActive: false },
            }),
            // Activate selected year
            db.year.update({
                where: { id: yearId },
                data: { isActive: true, isArchived: false },
            }),
        ]);

        revalidatePath("/");
        revalidatePath("/admin/rocniky");
        return { success: true };
    } catch (error) {
        console.error("Failed to set active year:", error);
        return { error: "Nepodařilo se aktivovat ročník" };
    }
}

export async function archiveYear(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const year = await db.year.findUnique({ where: { id: yearId } });

        if (year?.isActive) {
            return { error: "Nelze archivovat aktivní ročník" };
        }

        await db.year.update({
            where: { id: yearId },
            data: { isArchived: true },
        });

        revalidatePath("/admin/rocniky");
        revalidatePath("/archiv");
        return { success: true };
    } catch (error) {
        console.error("Failed to archive year:", error);
        return { error: "Nepodařilo se archivovat ročník" };
    }
}

export async function unarchiveYear(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.year.update({
            where: { id: yearId },
            data: { isArchived: false },
        });

        revalidatePath("/admin/rocniky");
        return { success: true };
    } catch (error) {
        console.error("Failed to unarchive year:", error);
        return { error: "Nepodařilo se obnovit ročník" };
    }
}

export async function deleteYear(yearId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        const year = await db.year.findUnique({ where: { id: yearId } });

        if (year?.isActive) {
            return { error: "Nelze smazat aktivní ročník" };
        }

        await db.year.delete({
            where: { id: yearId },
        });

        revalidatePath("/admin/rocniky");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete year:", error);
        return { error: "Nepodařilo se smazat ročník" };
    }
}

export async function toggleRegistration(yearId: string, open: boolean) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.year.update({
            where: { id: yearId },
            data: { registrationOpen: open },
        });

        revalidatePath("/admin/rocniky");
        revalidatePath(`/admin/rocniky/${yearId}`);
        revalidatePath("/");
        revalidatePath("/registrace");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle registration:", error);
        return { error: "Nepodařilo se změnit stav registrace" };
    }
}

export async function updateRegistrationStartDate(yearId: string, date: string | null) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        await db.year.update({
            where: { id: yearId },
            data: {
                registrationStartDate: date ? new Date(date) : null,
            },
        });

        revalidatePath("/admin/rocniky");
        revalidatePath(`/admin/rocniky/${yearId}`);
        revalidatePath("/");
        revalidatePath("/registrace");
        return { success: true };
    } catch (error) {
        console.error("Failed to update registration start date:", error);
        return { error: "Nepodařilo se uložit datum otevření registrace" };
    }
}

export async function updateBankAccount(yearId: string, formData: FormData) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const rawData = {
        bankAccountPrefix: formData.get("bankAccountPrefix") || null,
        bankAccountNumber: formData.get("bankAccountNumber") || null,
        bankAccountBankCode: formData.get("bankAccountBankCode") || null,
    };

    const validated = updateBankAccountSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        await db.year.update({
            where: { id: yearId },
            data: {
                bankAccountPrefix: validated.data.bankAccountPrefix,
                bankAccountNumber: validated.data.bankAccountNumber,
                bankAccountBankCode: validated.data.bankAccountBankCode,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/registrace`);
        revalidatePath("/registrace");
        return { success: true };
    } catch (error) {
        console.error("Failed to update bank account:", error);
        return { error: "Nepodařilo se uložit bankovní údaje" };
    }
}

export async function updateEmailTemplate(yearId: string, formData: FormData) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    const rawData = {
        confirmationEmailSubject: formData.get("confirmationEmailSubject") || "",
        confirmationEmailBody: formData.get("confirmationEmailBody") || "",
        confirmationEmailBcc: formData.get("confirmationEmailBcc") || null,
    };

    const validated = updateEmailTemplateSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        await db.year.update({
            where: { id: yearId },
            data: {
                confirmationEmailSubject: validated.data.confirmationEmailSubject,
                confirmationEmailBody: validated.data.confirmationEmailBody,
                confirmationEmailBcc: validated.data.confirmationEmailBcc,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/emaily`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update email template:", error);
        return { error: "Nepodařilo se uložit šablonu emailu" };
    }
}

export async function toggleConfirmationEmail(yearId: string, enabled: boolean) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemáte oprávnění" };
    }

    try {
        if (enabled) {
            const year = await db.year.findUnique({
                where: { id: yearId },
                select: {
                    confirmationEmailSubject: true,
                    confirmationEmailBody: true,
                },
            });

            if (!year?.confirmationEmailSubject || !year?.confirmationEmailBody) {
                return { error: "Nejdříve nastavte předmět a text emailu" };
            }
        }

        await db.year.update({
            where: { id: yearId },
            data: { confirmationEmailEnabled: enabled },
        });

        revalidatePath(`/admin/rocniky/${yearId}/emaily`);
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle confirmation email:", error);
        return { error: "Nepodařilo se změnit stav potvrzovacího emailu" };
    }
}

async function createDefaultPages(yearId: string) {
    const defaultPages = [
        { slug: "uvod", title: "Úvod", sortOrder: 0 },
        { slug: "program", title: "Program", sortOrder: 1 },
        { slug: "registrace", title: "Registrace", sortOrder: 2 },
        { slug: "pravidla", title: "Pravidla", sortOrder: 3 },
        { slug: "co-nabizime", title: "Co nabízíme", sortOrder: 4 },
        { slug: "galerie", title: "Galerie", sortOrder: 5 },
        { slug: "na-pamatku", title: "Na památku", sortOrder: 6 },
    ];

    await db.page.createMany({
        data: defaultPages.map((page) => ({
            ...page,
            yearId,
            content: { sections: [] },
            isPublished: false,
        })),
    });
}
