"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
    emailCampaignSchema,
    recipientFilterSchema,
    type EmailCampaignInput,
    type RecipientFilter,
} from "@/lib/validators/email-campaign";
import { resolveCampaignRecipients } from "@/lib/utils/email-campaign-recipients";
import { kickEmailQueue } from "@/lib/utils/email-queue";

interface ActionResult {
    success?: boolean;
    error?: string;
}

function campaignPath(yearId: string): string {
    return `/admin/rocniky/${yearId}/emaily/hromadne`;
}

export async function createCampaign(
    yearId: string,
    input: EmailCampaignInput,
): Promise<ActionResult & { id?: string }> {
    await requireAdmin();

    const parsed = emailCampaignSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Neplatná data" };
    }

    try {
        const campaign = await db.emailCampaign.create({
            data: {
                yearId,
                name: parsed.data.name,
                subject: parsed.data.subject,
                body: parsed.data.body,
                bcc: parsed.data.bcc || null,
                accountId: parsed.data.accountId || null,
                recipientFilter:
                    parsed.data.recipientFilter as Prisma.InputJsonValue,
            },
        });

        revalidatePath(campaignPath(yearId));
        return { success: true, id: campaign.id };
    } catch (error) {
        console.error("Failed to create campaign:", error);
        return { error: "Nepodařilo se vytvořit kampaň" };
    }
}

export async function updateCampaign(
    campaignId: string,
    input: EmailCampaignInput,
): Promise<ActionResult> {
    await requireAdmin();

    const parsed = emailCampaignSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Neplatná data" };
    }

    try {
        const updated = await db.emailCampaign.updateMany({
            where: { id: campaignId, status: "DRAFT" },
            data: {
                name: parsed.data.name,
                subject: parsed.data.subject,
                body: parsed.data.body,
                bcc: parsed.data.bcc || null,
                accountId: parsed.data.accountId || null,
                recipientFilter:
                    parsed.data.recipientFilter as Prisma.InputJsonValue,
            },
        });

        if (updated.count === 0) {
            return { error: "Kampaň lze upravit pouze ve stavu konceptu" };
        }

        const campaign = await db.emailCampaign.findUnique({
            where: { id: campaignId },
            select: { yearId: true },
        });
        if (campaign) revalidatePath(campaignPath(campaign.yearId));
        return { success: true };
    } catch (error) {
        console.error("Failed to update campaign:", error);
        return { error: "Nepodařilo se uložit kampaň" };
    }
}

export async function deleteCampaign(campaignId: string): Promise<ActionResult> {
    await requireAdmin();

    try {
        const campaign = await db.emailCampaign.findUnique({
            where: { id: campaignId },
            select: { yearId: true, status: true },
        });
        if (!campaign) {
            return { error: "Kampaň nebyla nalezena" };
        }
        if (campaign.status === "SENDING") {
            return { error: "Probíhající kampaň nelze smazat, nejdříve ji pozastavte" };
        }

        await db.emailCampaign.delete({ where: { id: campaignId } });

        revalidatePath(campaignPath(campaign.yearId));
        return { success: true };
    } catch (error) {
        console.error("Failed to delete campaign:", error);
        return { error: "Nepodařilo se smazat kampaň" };
    }
}

export async function previewRecipients(
    yearId: string,
    filter: RecipientFilter,
): Promise<{ count?: number; sample?: string[]; error?: string }> {
    await requireAdmin();

    const parsed = recipientFilterSchema.safeParse(filter);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? "Neplatný filtr" };
    }

    try {
        const recipients = await resolveCampaignRecipients(yearId, parsed.data);
        return {
            count: recipients.length,
            sample: recipients.slice(0, 10).map((r) => r.email),
        };
    } catch (error) {
        console.error("Failed to preview recipients:", error);
        return { error: "Nepodařilo se načíst příjemce" };
    }
}

export async function startCampaign(campaignId: string): Promise<ActionResult> {
    await requireAdmin();

    try {
        const campaign = await db.emailCampaign.findUnique({
            where: { id: campaignId },
            select: { id: true, yearId: true, status: true, recipientFilter: true },
        });
        if (!campaign) {
            return { error: "Kampaň nebyla nalezena" };
        }
        if (campaign.status !== "DRAFT") {
            return { error: "Kampaň již byla odeslána" };
        }

        const filter = recipientFilterSchema.safeParse(campaign.recipientFilter);
        if (!filter.success) {
            return { error: "Kampaň nemá platný filtr příjemců" };
        }

        const recipients = await resolveCampaignRecipients(
            campaign.yearId,
            filter.data,
        );
        if (recipients.length === 0) {
            return { error: "Filtru neodpovídají žádní příjemci" };
        }

        await db.$transaction(async (tx) => {
            await tx.emailQueueItem.createMany({
                data: recipients.map((r) => ({
                    campaignId: campaign.id,
                    recipient: r.email,
                    submissionId: r.submissionId,
                    placeholders: r.placeholders as Prisma.InputJsonValue,
                })),
            });
            await tx.emailCampaign.update({
                where: { id: campaign.id },
                data: {
                    status: "SENDING",
                    totalCount: recipients.length,
                    startedAt: new Date(),
                },
            });
        });

        after(() => kickEmailQueue());

        revalidatePath(campaignPath(campaign.yearId));
        return { success: true };
    } catch (error) {
        console.error("Failed to start campaign:", error);
        return { error: "Nepodařilo se spustit kampaň" };
    }
}

export async function pauseCampaign(campaignId: string): Promise<ActionResult> {
    await requireAdmin();

    try {
        const updated = await db.emailCampaign.updateMany({
            where: { id: campaignId, status: "SENDING" },
            data: { status: "PAUSED" },
        });
        if (updated.count === 0) {
            return { error: "Kampaň právě neodesílá" };
        }

        const campaign = await db.emailCampaign.findUnique({
            where: { id: campaignId },
            select: { yearId: true },
        });
        if (campaign) revalidatePath(campaignPath(campaign.yearId));
        return { success: true };
    } catch (error) {
        console.error("Failed to pause campaign:", error);
        return { error: "Nepodařilo se pozastavit kampaň" };
    }
}

/**
 * Resume a PAUSED campaign, or re-kick a stalled SENDING one (e.g. after a
 * dropped self-invocation chain).
 */
export async function resumeCampaign(campaignId: string): Promise<ActionResult> {
    await requireAdmin();

    try {
        const campaign = await db.emailCampaign.findUnique({
            where: { id: campaignId },
            select: { yearId: true, status: true },
        });
        if (!campaign) {
            return { error: "Kampaň nebyla nalezena" };
        }
        if (campaign.status !== "PAUSED" && campaign.status !== "SENDING") {
            return { error: "Kampaň nelze obnovit" };
        }

        if (campaign.status === "PAUSED") {
            await db.emailCampaign.update({
                where: { id: campaignId },
                data: { status: "SENDING" },
            });
        }

        after(() => kickEmailQueue());

        revalidatePath(campaignPath(campaign.yearId));
        return { success: true };
    } catch (error) {
        console.error("Failed to resume campaign:", error);
        return { error: "Nepodařilo se obnovit kampaň" };
    }
}

export async function retryFailedItems(campaignId: string): Promise<ActionResult> {
    await requireAdmin();

    try {
        const campaign = await db.emailCampaign.findUnique({
            where: { id: campaignId },
            select: { yearId: true, status: true },
        });
        if (!campaign) {
            return { error: "Kampaň nebyla nalezena" };
        }

        const updated = await db.emailQueueItem.updateMany({
            where: { campaignId, status: "failed" },
            data: { status: "pending", attempts: 0, lastError: null },
        });
        if (updated.count === 0) {
            return { error: "Žádné neúspěšné emaily k opakování" };
        }

        await db.emailCampaign.update({
            where: { id: campaignId },
            data: { status: "SENDING", completedAt: null },
        });

        after(() => kickEmailQueue());

        revalidatePath(campaignPath(campaign.yearId));
        return { success: true };
    } catch (error) {
        console.error("Failed to retry failed items:", error);
        return { error: "Nepodařilo se opakovat odeslání" };
    }
}
