import { z } from "zod";

export const recipientFilterSchema = z.object({
    statuses: z
        .array(
            z.enum(["PENDING", "CONFIRMED", "WAITLIST", "CANCELLED", "REJECTED"]),
        )
        .min(1, "Vyberte alespoň jeden stav registrace"),
    paid: z.enum(["all", "paid", "unpaid"]).default("all"),
});

export const emailCampaignSchema = z.object({
    name: z
        .string()
        .min(1, "Název je povinný")
        .max(200, "Název je příliš dlouhý"),
    subject: z
        .string()
        .min(1, "Předmět je povinný")
        .max(200, "Předmět je příliš dlouhý"),
    body: z.string().min(1, "Text emailu je povinný"),
    bcc: z.string().nullable().optional(),
    accountId: z.string().nullable().optional(),
    recipientFilter: recipientFilterSchema,
});

export type RecipientFilter = z.infer<typeof recipientFilterSchema>;
export type EmailCampaignInput = z.input<typeof emailCampaignSchema>;
