import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import QRCode from "qrcode";
import { generateSPAYD } from "@/lib/utils/spayd";

// Singleton transporter (same globalThis pattern as lib/db.ts)
const globalForMailer = globalThis as unknown as {
    mailer: Transporter | undefined;
};

function getTransporter(): Transporter {
    if (globalForMailer.mailer) {
        return globalForMailer.mailer;
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.seznam.cz",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    if (process.env.NODE_ENV !== "production") {
        globalForMailer.mailer = transporter;
    }

    return transporter;
}

/**
 * Replace {key} placeholders in a template string.
 */
export function replacePlaceholders(
    template: string,
    placeholders: Record<string, string>,
): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => {
        return placeholders[key] ?? match;
    });
}

/**
 * Build placeholder map from submission data + year info.
 * All form input field values are available by their field name,
 * plus computed values.
 */
export function buildPlaceholders(opts: {
    submissionData: Record<string, unknown>;
    variableSymbol: string | null;
    totalPrice: number | null;
    bankAccount: string | null;
    yearNumber: number;
    yearTitle: string;
}): Record<string, string> {
    const placeholders: Record<string, string> = {};

    // Add all form field values as placeholders
    for (const [key, value] of Object.entries(opts.submissionData)) {
        if (key === "additionalPeople") continue;
        if (value === null || value === undefined) {
            placeholders[key] = "";
        } else if (typeof value === "boolean") {
            placeholders[key] = value ? "Ano" : "Ne";
        } else {
            placeholders[key] = String(value);
        }
    }

    // Computed values
    placeholders.variabilniSymbol = opts.variableSymbol ?? "";
    placeholders.celkovaCena = opts.totalPrice != null ? `${opts.totalPrice} Kč` : "";
    placeholders.cisloUctu = opts.bankAccount ?? "";
    placeholders.rok = String(opts.yearNumber);
    placeholders.nazevRocniku = opts.yearTitle;

    return placeholders;
}

/**
 * Generate a QR payment code PNG buffer from payment parameters.
 * Returns null if generation fails.
 */
export async function generateQRPaymentImage(params: {
    iban: string;
    amount: number;
    variableSymbol?: string;
}): Promise<Buffer | null> {
    try {
        const spayd = generateSPAYD(params);
        const buffer = await QRCode.toBuffer(spayd, {
            type: "png",
            width: 200,
            margin: 1,
        });
        return buffer;
    } catch (error) {
        console.error("Failed to generate QR payment image:", error);
        return null;
    }
}

/**
 * Send a confirmation email. Returns true on success, false on failure.
 */
export async function sendConfirmationEmail(opts: {
    to: string;
    subject: string;
    body: string;
    bcc?: string;
    qrImageBuffer?: Buffer;
}): Promise<boolean> {
    try {
        const transporter = getTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;

        if (!from) {
            console.error("SMTP_FROM or SMTP_USER not configured");
            return false;
        }

        // Plain text: strip HTML tags and decode entities for text-only fallback
        const textBody = opts.body
            .replace(/\{qrPlatba\}/g, "")
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/p>/gi, "\n\n")
            .replace(/<\/li>/gi, "\n")
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&nbsp;/g, " ")
            .replace(/&quot;/g, "\"")
            .replace(/&#39;/g, "'")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        // HTML body: replace {qrPlatba} with embedded image if buffer provided
        let htmlBodyContent = opts.body;
        if (opts.qrImageBuffer) {
            htmlBodyContent = htmlBodyContent.replace(
                /\{qrPlatba\}/g,
                '<img src="cid:qr-payment" width="200" height="200" alt="QR platba" style="display:block;">',
            );
        } else {
            htmlBodyContent = htmlBodyContent.replace(/\{qrPlatba\}/g, "");
        }

        const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
${htmlBodyContent}
</body>
</html>`;

        const attachments = opts.qrImageBuffer
            ? [{
                filename: "qr-payment.png",
                content: opts.qrImageBuffer,
                cid: "qr-payment",
            }]
            : [];

        await transporter.sendMail({
            from,
            to: opts.to,
            bcc: opts.bcc || undefined,
            subject: opts.subject,
            text: textBody,
            html: htmlBody,
            attachments,
        });

        return true;
    } catch (error) {
        console.error("Failed to send confirmation email:", error);
        return false;
    }
}
