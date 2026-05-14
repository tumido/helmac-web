import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import QRCode from "qrcode";
import path from "path";
import { readFile } from "fs/promises";
import { generateSPAYD } from "@/lib/utils/spayd";
import { db } from "@/lib/db";
import { decrypt } from "@/lib/utils/encryption";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import type { FormField, PricingDefinition } from "@/lib/types/registration-form";
import { evaluateCondition } from "@/lib/utils/condition-evaluation";

// Cache transporters by account ID
const globalForMailer = globalThis as unknown as {
    mailerCache: Map<string, { transporter: Transporter; from: string }> | undefined;
};

function getMailerCache(): Map<string, { transporter: Transporter; from: string }> {
    if (!globalForMailer.mailerCache) {
        globalForMailer.mailerCache = new Map();
    }
    return globalForMailer.mailerCache;
}

/**
 * Get a nodemailer transporter for a specific email account.
 * If accountId is null/undefined, uses the main account.
 * Returns { transporter, from } where from is the sender email address.
 */
export async function getTransporterForAccount(
    accountId?: string | null,
): Promise<{ transporter: Transporter; from: string }> {
    const cache = getMailerCache();

    // Try cache first
    const cacheKey = accountId || "__main__";
    const cached = cache.get(cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch account from DB
    const account = accountId
        ? await db.emailAccount.findUnique({ where: { id: accountId } })
        : await db.emailAccount.findFirst({ where: { isMain: true } });

    if (!account) {
        throw new Error(
            accountId
                ? `Email account ${accountId} not found`
                : "No main email account configured. Please add one in admin settings.",
        );
    }

    const password = decrypt(account.encryptedPassword);

    const transporter = nodemailer.createTransport({
        host: "smtp.seznam.cz",
        port: 465,
        secure: true,
        auth: {
            user: account.email,
            pass: password,
        },
    });

    const result = { transporter, from: account.email };

    if (process.env.NODE_ENV !== "production") {
        cache.set(cacheKey, result);
    }

    return result;
}

/**
 * Invalidate cached transporters (call after account updates).
 */
export function invalidateTransporterCache() {
    const cache = getMailerCache();
    for (const entry of cache.values()) {
        entry.transporter.close();
    }
    cache.clear();
}

/**
 * Append conditional sections whose conditions evaluate to true against the
 * registration submission data. Sections are sorted by sortOrder and
 * concatenated to the body with `\n\n` separators. Placeholder replacement is
 * the caller's responsibility — run replacePlaceholders on the result.
 */
export function appendConditionalSections(opts: {
    body: string;
    sections: EmailConditionalSection[];
    rawSubmissionData: Record<string, unknown>;
    allFields: FormField[];
    pricingDefinitions?: PricingDefinition[];
}): string {
    const { body, sections, rawSubmissionData, allFields, pricingDefinitions } = opts;
    if (!sections || sections.length === 0) return body;

    const matched = [...sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .filter((s) =>
            evaluateCondition(
                s.condition,
                rawSubmissionData,
                allFields,
                pricingDefinitions,
            ),
        );

    if (matched.length === 0) return body;

    const extra = matched.map((s) => s.body).join("\n\n");
    return body ? `${body}\n\n${extra}` : extra;
}

/**
 * Return the flattened attachments from all sections whose condition matches
 * the submission data. Order follows section sortOrder.
 */
export function collectMatchingSectionAttachments(opts: {
    sections: EmailConditionalSection[];
    rawSubmissionData: Record<string, unknown>;
    allFields: FormField[];
    pricingDefinitions?: PricingDefinition[];
}): { filename: string; url: string }[] {
    const { sections, rawSubmissionData, allFields, pricingDefinitions } = opts;
    if (!sections || sections.length === 0) return [];

    const result: { filename: string; url: string }[] = [];
    for (const s of [...sections].sort((a, b) => a.sortOrder - b.sortOrder)) {
        if (!s.attachments || s.attachments.length === 0) continue;
        if (
            evaluateCondition(
                s.condition,
                rawSubmissionData,
                allFields,
                pricingDefinitions,
            )
        ) {
            for (const a of s.attachments) {
                result.push({ filename: a.filename, url: a.url });
            }
        }
    }
    return result;
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
    iban: string | null;
    swift: string | null;
    yearNumber: number;
    yearTitle: string;
    yearSubtitle: string | null;
}): Record<string, string> {
    const placeholders: Record<string, string> = {};

    // Add all form field values as placeholders
    for (const [key, value] of Object.entries(opts.submissionData)) {
        if (key === "additionalPeople") continue;
        if (value === null || value === undefined) {
            placeholders[key] = "";
        } else if (typeof value === "boolean") {
            placeholders[key] = value ? "Ano" : "Ne";
        } else if (
            typeof value === "string" &&
            value.startsWith("[") &&
            value.endsWith("]")
        ) {
            try {
                const parsed = JSON.parse(value);
                placeholders[key] = Array.isArray(parsed)
                    ? parsed.map((v) => String(v)).join(", ")
                    : value;
            } catch {
                placeholders[key] = value;
            }
        } else {
            placeholders[key] = String(value);
        }
    }

    // Computed values
    placeholders.variabilniSymbol = opts.variableSymbol ?? "";
    placeholders.celkovaCena = opts.totalPrice != null ? `${opts.totalPrice} Kč` : "";
    placeholders.cisloUctu = opts.bankAccount ?? "";
    placeholders.iban = opts.iban ?? "";
    placeholders.swift = opts.swift ?? "";
    placeholders.rok = String(opts.yearNumber);
    placeholders.nazevRocniku = opts.yearTitle;
    placeholders.podtitulek = opts.yearSubtitle ?? "";

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
 * Send a verification email to a public user. Always uses the main account.
 */
export async function sendVerificationEmail(opts: {
    to: string;
    verificationUrl: string;
}): Promise<boolean> {
    try {
        const { transporter, from } = await getTransporterForAccount();

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
            subject: "Ověření emailu – HELMÁČ",
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
 * Send a password reset email to a public user. Always uses the main account.
 */
export async function sendPasswordResetEmail(opts: {
    to: string;
    resetUrl: string;
}): Promise<boolean> {
    try {
        const { transporter, from } = await getTransporterForAccount();

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
            subject: "Obnovení hesla – HELMÁČ",
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
 * Uses the specified accountId, or falls back to the main account.
 */
export async function sendConfirmationEmail(opts: {
    to: string;
    subject: string;
    body: string;
    bcc?: string;
    qrImageBuffer?: Buffer;
    accountId?: string | null;
    attachments?: { filename: string; url: string }[];
}): Promise<boolean> {
    try {
        const { transporter, from } = await getTransporterForAccount(opts.accountId);

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

        const attachments: Array<
            | { filename: string; content: Buffer; cid: string }
            | { filename: string; href: string }
            | { filename: string; content: Buffer }
        > = [];
        if (opts.qrImageBuffer) {
            attachments.push({
                filename: "qr-payment.png",
                content: opts.qrImageBuffer,
                cid: "qr-payment",
            });
        }
        for (const a of opts.attachments ?? []) {
            if (a.url.startsWith("/")) {
                try {
                    const localPath = path.join(process.cwd(), "public", a.url.replace(/^\/+/, ""));
                    const content = await readFile(localPath);
                    attachments.push({ filename: a.filename, content });
                } catch (err) {
                    console.error(`Failed to read local attachment ${a.url}:`, err);
                }
            } else {
                attachments.push({ filename: a.filename, href: a.url });
            }
        }

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
