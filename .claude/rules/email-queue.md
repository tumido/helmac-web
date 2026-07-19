# Mass Email Queue

Mass-email campaigns (`EmailCampaign` + `EmailQueueItem` models) are sent through a rate-limited, self-chaining queue — Vercel Hobby crons run only once a day, so there is no minute-level drain cron.

## Architecture

- `lib/utils/email-queue.ts` — `processEmailQueue()` claims the oldest `SENDING` campaign via an atomic `lockedAt` lock, sends one throttled batch, enforces global hourly/daily caps by counting `sent` items by `sentAt`, and returns `remaining`. `kickEmailQueue()` fire-and-forgets a POST to the processor route (5s abort; always call it inside `after()` from `next/server`).
- `app/api/email-queue/process/route.ts` — Bearer `CRON_SECRET` auth, `maxDuration = 300`. Re-kicks itself while items remain; idles via `waitForCapHeadroom()` when caps are exhausted.
- `lib/actions/email-campaigns.ts` — admin server actions (create/update/delete/preview/start/pause/resume/retry). `startCampaign` resolves recipients via `lib/utils/email-campaign-recipients.ts` (dedupes by email, stores per-recipient placeholders on each queue item) and kicks the chain.
- Safety nets for a dropped chain: daily `update-prices` cron re-kicks when a `SENDING` campaign exists; the campaign detail page shows a stalled warning + resume button.
- Admin UI: `app/admin/rocniky/[id]/emaily/hromadne/` — compose-and-send flow (admin-only, `requireAdmin` on pages): `mass-email-composer.tsx` on the main page (group select all/paid/unpaid → fixed statuses `PENDING/CONFIRMED/WAITLIST`, no placeholders in the editor) with a test-send dialog and a confirm dialog that runs `createCampaign` + `startCampaign` back-to-back, then redirects to the detail page for live progress. There is no draft-authoring page; `campaign-form.tsx` remains only for editing legacy `DRAFT` rows on the detail page.
- UI wording: user-facing Czech text says "hromadný email" / "hromadné emaily" — never "kampaň" (spec: `docs/specs/2026-07-19-mass-email-sending.md`). Code identifiers keep the `campaign` naming.

## Rate limits (Seznam.cz)

Seznam publishes no exact per-account outbound limit but blocks bursty senders. Keep: pooled transporter with `maxMessages: 100` per connection, ~3s between messages, conservative global caps. Tuning via env vars (all optional): `EMAIL_QUEUE_BATCH_SIZE` (50), `EMAIL_QUEUE_DELAY_MS` (3000), `EMAIL_QUEUE_HOURLY_CAP` (300), `EMAIL_QUEUE_DAILY_CAP` (900), `EMAIL_QUEUE_MAX_ATTEMPTS` (3).

## Invariants

- Items are marked `sending` + `attempts` incremented BEFORE the SMTP call (bounds duplicate sends on crash); `sending` items found at claim time are recovered to `pending`.
- Permanent failures (SMTP 5xx, `EENVELOPE`) or exhausted attempts → `failed` with `lastError`; temporary errors return to `pending`.
- Campaign body/subject are rendered per item at send time with `replacePlaceholders` — never duplicate the body into queue items.
- Local testing: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/email-queue/process` (CRON_SECRET lives in `.env.local`).
