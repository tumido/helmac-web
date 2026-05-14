import { z } from "zod";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_TOTAL = 25 * 1024 * 1024;

export const ATTACHMENT_ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
];

const urlSchema = z.string().min(1).refine(
    (v) => v.startsWith("/") || /^https?:\/\//i.test(v),
    { message: "Neplatná URL" },
);

export const emailAttachmentSchema = z.object({
    filename: z.string().min(1).max(255),
    url: urlSchema,
    contentType: z.string().min(1).max(255),
    size: z.number().int().nonnegative(),
});

export type EmailAttachment = z.infer<typeof emailAttachmentSchema>;

export const emailAttachmentsSchema = z
    .array(emailAttachmentSchema)
    .max(20)
    .superRefine((items, ctx) => {
        const total = items.reduce((sum, a) => sum + a.size, 0);
        if (total > MAX_ATTACHMENTS_TOTAL) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Celková velikost příloh přesahuje 25 MB`,
            });
        }
    });

export function parseEmailAttachmentsJson(raw: unknown): EmailAttachment[] {
    if (raw === undefined || raw === null || raw === "") {
        return [];
    }
    let parsed: unknown = raw;
    if (typeof raw === "string") {
        try {
            parsed = JSON.parse(raw);
        } catch {
            throw new Error("Neplatný formát JSON pro přílohy");
        }
    }
    const result = emailAttachmentsSchema.safeParse(parsed);
    if (!result.success) {
        const msg = result.error.issues[0]?.message ?? "Neplatné přílohy";
        throw new Error(msg);
    }
    return result.data;
}
