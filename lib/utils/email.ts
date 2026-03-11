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
 * Send a verification email to a public user.
 */
export async function sendVerificationEmail(opts: {
    to: string;
    verificationUrl: string;
}): Promise<boolean> {
    try {
        const transporter = getTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;
        if (!from) {
            console.error("SMTP_FROM or SMTP_USER not configured");
            return false;
        }

        const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
<h2>Ověření emailu</h2>
<p>Děkujeme za registraci. Pro ověření vašeho emailu klikněte na odkaz níže:</p>
<p><a href="${opts.verificationUrl}" style="display: inline-block; background-color: #c8a951; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ověřit email</a></p>
<p>Pokud odkaz nefunguje, zkopírujte do prohlížeče tuto adresu:</p>
<p style="word-break: break-all;">${opts.verificationUrl}</p>
<p style="color: #666; font-size: 0.875rem;">Odkaz je platný 24 hodin. Pokud jste se neregistrovali, tento email ignorujte.</p>
</body>
</html>`;

        const textBody = `Ověření emailu\n\nDěkujeme za registraci. Pro ověření vašeho emailu navštivte tento odkaz:\n\n${opts.verificationUrl}\n\nOdkaz je platný 24 hodin. Pokud jste se neregistrovali, tento email ignorujte.`;

        await transporter.sendMail({
            from,
            to: opts.to,
            subject: "Ověření emailu – HELMAC",
            text: textBody,
            html: htmlBody,
        });

        return true;
    } catch (error) {
        console.error("Failed to send verification email:", error);
        return false;
    }
}

/**
 * Send a password reset email to a public user.
 */
export async function sendPasswordResetEmail(opts: {
    to: string;
    resetUrl: string;
}): Promise<boolean> {
    try {
        const transporter = getTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;
        if (!from) {
            console.error("SMTP_FROM or SMTP_USER not configured");
            return false;
        }

        const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
<h2>Obnovení hesla</h2>
<p>Obdrželi jsme žádost o obnovení hesla k vašemu účtu. Klikněte na odkaz níže:</p>
<p><a href="${opts.resetUrl}" style="display: inline-block; background-color: #c8a951; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Nastavit nové heslo</a></p>
<p>Pokud odkaz nefunguje, zkopírujte do prohlížeče tuto adresu:</p>
<p style="word-break: break-all;">${opts.resetUrl}</p>
<p style="color: #666; font-size: 0.875rem;">Odkaz je platný 1 hodinu. Pokud jste o obnovení hesla nežádali, tento email ignorujte.</p>
</body>
</html>`;

        const textBody = `Obnovení hesla\n\nObdrželi jsme žádost o obnovení hesla. Navštivte tento odkaz:\n\n${opts.resetUrl}\n\nOdkaz je platný 1 hodinu. Pokud jste o obnovení hesla nežádali, tento email ignorujte.`;

        await transporter.sendMail({
            from,
            to: opts.to,
            subject: "Obnovení hesla – HELMAC",
            text: textBody,
            html: htmlBody,
        });

        return true;
    } catch (error) {
        console.error("Failed to send password reset email:", error);
        return false;
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
