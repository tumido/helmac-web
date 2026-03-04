"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import type { RegistrationStatus } from "@prisma/client";

interface ActionResult {
    success?: boolean;
    error?: string;
}

export async function updateSubmissionStatus(
    submissionId: string,
    status: RegistrationStatus
): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.update({
            where: { id: submissionId },
            data: { status },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update submission status:", error);
        return { error: "Nepodařilo se změnit stav registrace" };
    }
}

export async function toggleSubmissionPayment(
    submissionId: string,
    isPaid: boolean
): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.update({
            where: { id: submissionId },
            data: {
                isPaid,
                paidAt: isPaid ? new Date() : null,
            },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle payment:", error);
        return { error: "Nepodařilo se změnit stav platby" };
    }
}

export async function updateSubmissionData(
    submissionId: string,
    data: Record<string, unknown>
): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.update({
            where: { id: submissionId },
            data: { data: data as Prisma.InputJsonValue },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update submission data:", error);
        return { error: "Nepodařilo se aktualizovat data registrace" };
    }
}

export async function deleteSubmission(submissionId: string): Promise<ActionResult> {
    await requireAdmin();

    try {
        const submission = await db.registrationSubmission.delete({
            where: { id: submissionId },
            select: { yearId: true },
        });

        revalidatePath(`/admin/rocniky/${submission.yearId}/registrace`);
        return { success: true };
    } catch (error) {
        console.error("Failed to delete submission:", error);
        return { error: "Nepodařilo se smazat registraci" };
    }
}
