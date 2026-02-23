"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createRuleSchema, updateRuleSchema } from "@/lib/validators/rules";

export type RuleActionState = {
    error?: {
        title?: string[];
        content?: string[];
        sortOrder?: string[];
        _form?: string[];
    };
    success?: boolean;
} | null;

export async function createRule(
    yearId: string,
    prevState: RuleActionState,
    formData: FormData
): Promise<RuleActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        title: formData.get("title"),
        content: formData.get("content"),
        sortOrder: formData.get("sortOrder") || undefined,
    };

    const validated = createRuleSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    try {
        // Get max sortOrder for auto-ordering
        const maxOrder = await db.rule.aggregate({
            where: { yearId },
            _max: { sortOrder: true },
        });

        await db.rule.create({
            data: {
                yearId,
                title: validated.data.title,
                content: validated.data.content,
                sortOrder: validated.data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/pravidla`);
        revalidatePath("/pravidla");
    } catch (error) {
        console.error("Failed to create rule:", error);
        return { error: { _form: ["Nepodarilo se vytvorit pravidlo"] } };
    }

    redirect(`/admin/rocniky/${yearId}/pravidla`);
}

export async function updateRule(
    ruleId: string,
    prevState: RuleActionState,
    formData: FormData
): Promise<RuleActionState> {
    try {
        await requireAdmin();
    } catch {
        return { error: { _form: ["Nemate opravneni"] } };
    }

    const rawData = {
        title: formData.get("title"),
        content: formData.get("content"),
        sortOrder: formData.get("sortOrder") || undefined,
    };

    const validated = updateRuleSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    let yearId: string;

    try {
        const rule = await db.rule.findUnique({
            where: { id: ruleId },
            select: { yearId: true },
        });

        if (!rule) {
            return { error: { _form: ["Pravidlo nenalezeno"] } };
        }

        yearId = rule.yearId;

        await db.rule.update({
            where: { id: ruleId },
            data: {
                title: validated.data.title,
                content: validated.data.content,
                sortOrder: validated.data.sortOrder,
            },
        });

        revalidatePath(`/admin/rocniky/${yearId}/pravidla`);
        revalidatePath("/pravidla");
    } catch (error) {
        console.error("Failed to update rule:", error);
        return { error: { _form: ["Nepodarilo se upravit pravidlo"] } };
    }

    redirect(`/admin/rocniky/${yearId}/pravidla`);
}

export async function deleteRule(ruleId: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: "Nemate opravneni" };
    }

    try {
        await db.rule.delete({
            where: { id: ruleId },
        });

        revalidatePath("/pravidla");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete rule:", error);
        return { error: "Nepodarilo se smazat pravidlo" };
    }
}
