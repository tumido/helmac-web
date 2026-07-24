import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
    createSmtpTransporterForAccount,
    replacePlaceholders,
    sendCampaignEmail,
} from "@/lib/utils/email";
import { getBaseUrl } from "@/lib/utils/url";

function envInt(name: string, fallback: number): number {
    const raw = process.env[name];
    if (!raw) return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Seznam.cz has no published per-account limit; it temporarily blocks bursty
// senders. Guidance: max 100 msgs per SMTP connection, spread sending over
// tens of minutes to hours. Defaults stay conservative and are env-tunable.
export const EMAIL_QUEUE_CONFIG = {
    batchSize: () => envInt("EMAIL_QUEUE_BATCH_SIZE", 50),
    delayMs: () => envInt("EMAIL_QUEUE_DELAY_MS", 3000),
    hourlyCap: () => envInt("EMAIL_QUEUE_HOURLY_CAP", 300),
    dailyCap: () => envInt("EMAIL_QUEUE_DAILY_CAP", 900),
    maxAttempts: () => envInt("EMAIL_QUEUE_MAX_ATTEMPTS", 3),
    // Stop sending this much before Vercel's maxDuration (300s) ends
    timeBudgetMs: () => envInt("EMAIL_QUEUE_TIME_BUDGET_MS", 280_000),
    // A campaign lock older than this is considered a crashed invocation
    lockStaleMs: () => envInt("EMAIL_QUEUE_LOCK_STALE_MS", 360_000),
    // Interactive-transaction timeout for the advisory-lock wrapper. Must be
    // > timeBudgetMs (the drain finishes first) and < Vercel maxDuration (300s).
    txLockTimeoutMs: () => envInt("EMAIL_QUEUE_TX_LOCK_TIMEOUT_MS", 295_000),
    // A SENDING campaign whose lock has been idle this long with items still
    // pending most likely lost its self-invocation chain (stall detection).
    stalledAfterMs: () => envInt("EMAIL_QUEUE_STALLED_AFTER_MS", 600_000),
} as const;

// Stable key for the transaction-scoped advisory lock that serializes queue
// draining across serverless invocations (so global caps can't be exceeded by
// two invocations reading headroom independently).
const EMAIL_QUEUE_ADVISORY_LOCK_KEY = 482300111;

export interface ProcessResult {
    processed: number;
    sent: number;
    failed: number;
    remaining: number;
    capReached: boolean;
    campaignId: string | null;
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SmtpError {
    responseCode?: number;
    code?: string;
    message?: string;
}

// 5xx SMTP replies and envelope errors (bad address) never succeed on retry
function isPermanentSendError(err: SmtpError): boolean {
    if (typeof err.responseCode === "number" && err.responseCode >= 500) {
        return true;
    }
    return err.code === "EENVELOPE";
}

/**
 * Count campaign emails sent within the sliding hour/day windows and return
 * how many more may be sent now. Enforced globally across all campaigns and
 * serverless invocations (counters live in Postgres).
 */
export async function getCapHeadroom(): Promise<number> {
    const now = Date.now();
    const [hourCount, dayCount] = await Promise.all([
        db.emailQueueItem.count({
            where: { status: "sent", sentAt: { gte: new Date(now - 3_600_000) } },
        }),
        db.emailQueueItem.count({
            where: { status: "sent", sentAt: { gte: new Date(now - 86_400_000) } },
        }),
    ]);
    return Math.max(
        0,
        Math.min(
            EMAIL_QUEUE_CONFIG.hourlyCap() - hourCount,
            EMAIL_QUEUE_CONFIG.dailyCap() - dayCount,
        ),
    );
}

/**
 * Process one batch of the email queue. Serializes the whole drain behind a
 * transaction-scoped Postgres advisory lock so only one invocation drains at a
 * time globally — otherwise two concurrent invocations each read cap headroom
 * independently and combined can overshoot the hourly/daily caps. A second
 * invocation that can't grab the lock exits immediately; the holder self-chains.
 */
export async function processEmailQueue(): Promise<ProcessResult> {
    return db.$transaction(
        async (tx) => {
            const rows = await tx.$queryRaw<{ locked: boolean }[]>`
                SELECT pg_try_advisory_xact_lock(${EMAIL_QUEUE_ADVISORY_LOCK_KEY}) AS locked`;
            if (!rows[0]?.locked) {
                // Another invocation is already draining the queue; skip so we
                // don't double-count cap headroom. That invocation self-chains.
                return {
                    processed: 0,
                    sent: 0,
                    failed: 0,
                    remaining: 0,
                    capReached: false,
                    campaignId: null,
                };
            }
            return drainQueue(tx);
        },
        { timeout: EMAIL_QUEUE_CONFIG.txLockTimeoutMs(), maxWait: 5000 },
    );
}

/**
 * Drain one batch: claim the oldest SENDING campaign, send up to batchSize
 * emails throttled by delayMs, respecting global hourly/daily caps. Returns
 * counts; the caller decides whether to chain.
 *
 * Runs inside the advisory-lock transaction. All writes/counts use the
 * module-level `db` client (they commit immediately, so the detail-page polling
 * shows live progress). Only the per-item status re-check uses `tx` — that read
 * doubles as a keepalive so the pinned lock connection isn't terminated for
 * sitting idle-in-transaction during the ~3s-per-item send loop.
 */
async function drainQueue(tx: Prisma.TransactionClient): Promise<ProcessResult> {
    const start = Date.now();
    const maxAttempts = EMAIL_QUEUE_CONFIG.maxAttempts();

    const result: ProcessResult = {
        processed: 0,
        sent: 0,
        failed: 0,
        remaining: 0,
        capReached: false,
        campaignId: null,
    };

    // Claim a campaign with an atomic lock (stale locks are taken over)
    const candidates = await db.emailCampaign.findMany({
        where: { status: "SENDING" },
        orderBy: { createdAt: "asc" },
        select: { id: true, subject: true, body: true, bcc: true, accountId: true },
    });

    let campaign: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
        const claimed = await db.emailCampaign.updateMany({
            where: {
                id: candidate.id,
                status: "SENDING",
                OR: [
                    { lockedAt: null },
                    {
                        lockedAt: {
                            lt: new Date(
                                start - EMAIL_QUEUE_CONFIG.lockStaleMs(),
                            ),
                        },
                    },
                ],
            },
            data: { lockedAt: new Date() },
        });
        if (claimed.count === 1) {
            campaign = candidate;
            break;
        }
    }

    if (!campaign) {
        return result;
    }
    result.campaignId = campaign.id;

    try {
        // Recover items stuck in "sending" from a crashed invocation.
        // Their attempts counter was already incremented, so no retry loop.
        // Residual risk: if the crash happened AFTER the SMTP send but BEFORE
        // the "sent" write, the recipient gets one duplicate on recovery. The
        // pre-incremented attempts bounds this to at most one extra send per
        // crash; we accept it rather than add a pre-send idempotency journal.
        await db.emailQueueItem.updateMany({
            where: { campaignId: campaign.id, status: "sending" },
            data: { status: "pending" },
        });

        const headroom = await getCapHeadroom();
        const allowed = Math.min(EMAIL_QUEUE_CONFIG.batchSize(), headroom);

        if (allowed > 0) {
            const items = await db.emailQueueItem.findMany({
                where: {
                    campaignId: campaign.id,
                    status: "pending",
                    attempts: { lt: maxAttempts },
                },
                orderBy: { createdAt: "asc" },
                take: allowed,
                select: { id: true, recipient: true, placeholders: true, attempts: true },
            });

            if (items.length > 0) {
                const { transporter, from } =
                    await createSmtpTransporterForAccount(campaign.accountId, {
                        pool: true,
                    });

                try {
                    for (const item of items) {
                        if (
                            Date.now() - start >
                            EMAIL_QUEUE_CONFIG.timeBudgetMs()
                        ) {
                            break;
                        }

                        // Stop mid-batch when an admin pauses (or otherwise
                        // un-SENDINGs) the campaign; one cheap query per item
                        // at a ~3s cadence. Runs through `tx` so it doubles as
                        // a keepalive on the advisory-lock connection; READ
                        // COMMITTED still sees the admin's committed pause.
                        const current = await tx.emailCampaign.findUnique({
                            where: { id: campaign.id },
                            select: { status: true },
                        });
                        if (current?.status !== "SENDING") {
                            break;
                        }

                        // Mark sending BEFORE the SMTP call so a crash cannot
                        // cause an unbounded resend of the same item
                        await db.emailQueueItem.update({
                            where: { id: item.id },
                            data: {
                                status: "sending",
                                attempts: { increment: 1 },
                            },
                        });
                        result.processed++;

                        const placeholders = (item.placeholders ?? {}) as Record<
                            string,
                            string
                        >;

                        try {
                            await sendCampaignEmail({
                                transporter,
                                from,
                                to: item.recipient,
                                subject: replacePlaceholders(
                                    campaign.subject,
                                    placeholders,
                                ),
                                body: replacePlaceholders(
                                    campaign.body,
                                    placeholders,
                                ),
                                bcc: campaign.bcc,
                            });

                            await db.emailQueueItem.update({
                                where: { id: item.id },
                                data: {
                                    status: "sent",
                                    sentAt: new Date(),
                                    lastError: null,
                                },
                            });
                            result.sent++;
                        } catch (error) {
                            const err = error as SmtpError;
                            const permanent =
                                isPermanentSendError(err) ||
                                item.attempts + 1 >= maxAttempts;
                            const message = (
                                err.message ?? String(error)
                            ).slice(0, 500);

                            await db.emailQueueItem.update({
                                where: { id: item.id },
                                data: {
                                    status: permanent ? "failed" : "pending",
                                    // Only a hard SMTP failure (5xx / bad
                                    // envelope) is a permanent failure. Running
                                    // out of attempts also lands in "failed"
                                    // below, but stays retryable — a manual
                                    // bulk retry gives those fresh attempts.
                                    permanent: isPermanentSendError(err),
                                    lastError: message,
                                },
                            });
                            if (permanent) result.failed++;
                            console.error(
                                `Campaign ${campaign.id}: send to ${item.recipient} failed:`,
                                message,
                            );
                        }

                        await sleep(EMAIL_QUEUE_CONFIG.delayMs());
                    }
                } finally {
                    transporter.close();
                }
            }
        }

        // Items that ran out of attempts but are still pending → failed
        await db.emailQueueItem.updateMany({
            where: {
                campaignId: campaign.id,
                status: "pending",
                attempts: { gte: maxAttempts },
            },
            data: { status: "failed", lastError: "Vyčerpán počet pokusů" },
        });

        result.remaining = await db.emailQueueItem.count({
            where: {
                campaignId: campaign.id,
                status: "pending",
                attempts: { lt: maxAttempts },
            },
        });
        result.capReached = result.remaining > 0 && allowed === 0;

        if (result.remaining === 0) {
            // Status guard: never flip a campaign paused mid-batch to COMPLETED
            await db.emailCampaign.updateMany({
                where: { id: campaign.id, status: "SENDING" },
                data: { status: "COMPLETED", completedAt: new Date() },
            });
        }

        return result;
    } finally {
        await db.emailCampaign.updateMany({
            where: { id: campaign.id },
            data: { lockedAt: null },
        });
    }
}

/**
 * Fire-and-forget kick of the queue processor route. Waits only long enough
 * (5s) to be confident the request left the building, never for the response
 * (the invocation may run for minutes). Errors are intentionally swallowed —
 * the daily cron and the admin UI resume button are the safety nets.
 */
export async function kickEmailQueue(): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        await fetch(`${getBaseUrl()}/api/email-queue/process`, {
            method: "POST",
            headers: {
                authorization: `Bearer ${process.env.CRON_SECRET}`,
            },
            signal: controller.signal,
        });
    } catch (error) {
        // AbortError after 5s is the expected path (we never wait for the
        // response). Anything else is a genuinely-failed kick worth logging;
        // the daily cron safety net still recovers the chain.
        if ((error as Error)?.name !== "AbortError") {
            console.error("Failed to kick email queue:", error);
        }
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * When the hourly cap is exhausted, idle inside the current invocation and
 * re-check periodically until headroom appears or the time budget runs out.
 * Keeps the self-invocation chain alive across a cap window.
 *
 * This deliberately burns serverless compute idling (up to ~timeBudgetMs in
 * 30s ticks) instead of returning and relying on the daily cron to re-kick:
 * the cron runs once a day (Vercel Hobby), so returning here could stall a
 * campaign for up to 24h. Holding the invocation trades a few minutes of idle
 * compute for same-window delivery continuity.
 */
export async function waitForCapHeadroom(startedAt: number): Promise<boolean> {
    while (Date.now() - startedAt < EMAIL_QUEUE_CONFIG.timeBudgetMs()) {
        // Jitter so multiple idling invocations don't re-check in lockstep
        await sleep(30_000 + Math.floor(Math.random() * 5_000));
        if ((await getCapHeadroom()) > 0) {
            return true;
        }
    }
    return false;
}
