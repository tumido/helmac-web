# Mass Email Sending (Hromadné emaily)

## Purpose

Admins need to send a one-off informational email to registered participants of a
selected year (event) — announcements, reminders, organizational updates. This is
mass informing, not marketing: the UI never uses the word "kampaň"; the feature is
called **"hromadný email" / "hromadné emaily"** everywhere.

## Access

- URL: `/admin/rocniky/{yearId}/emaily/hromadne`
- Sidebar: "Hromadné" item under the "Emaily" section of the selected year
- Restricted to `ADMIN` and `SUPER_ADMIN` (page guard `requireAdmin()`, sidebar
  item role-filtered, all server actions enforce it independently)

## Compose-and-send UX

One page with a composer on top and a history table below.

Composer:

- **Recipient group** select above the editor: "Všichni registrovaní" /
  "Zaplacení" / "Nezaplacení". Groups map to registrations with status
  `PENDING`, `CONFIRMED`, or `WAITLIST` (cancelled/rejected and test
  registrations are always excluded), optionally filtered by `isPaid`.
  Recipient addresses come from the form's email field and are deduplicated
  case-insensitively — one send per unique address.
- **Sender** select (configured email accounts, main account by default).
- **Subject** text field.
- **WYSIWYG body editor** (Tiptap, HTML output) — pure text only, no
  registration-form merge fields/placeholders.
- **Two buttons above the editor** (enabled once subject and body are filled):
  - **"Testovací odeslání"** — modal with a single email input; sends the
    composed email only to that address.
  - **"Odeslat"** — confirmation modal showing the subject, the rendered email
    body, and the exact recipient count for the chosen group. Confirming
    creates the send and starts it immediately (there is no draft-authoring
    step; the email is written down and sent).

After confirming, the admin is redirected to the detail page showing live
progress (sent / total, failed items with errors, pause / resume / retry).
Sending happens in the background and survives closing the browser.

## Detail page as a permanent log

The detail page of a started send is an audit log and always stays visible:

- Shows the subject, the rendered email body, and a collapsible "Příjemci (N)"
  list of every recipient address with per-recipient status (sent / failed /
  queued) and sent time.
- A started send (`SENDING` / `PAUSED` / `COMPLETED`) **cannot be deleted** —
  neither from the UI nor via the server action. Only unsent legacy drafts
  (`DRAFT`) remain deletable.

## Sending backend (pre-existing, kept as-is)

- Each send persists an `EmailCampaign` row plus `EmailQueueItem` rows (one per
  recipient) — required for the queue, progress, and retries. Persistence is an
  implementation detail; the UI offers no draft management.
- A DB-backed queue processes items in batches via a self-invoking route
  (`/api/email-queue/process`), throttled for the SMTP provider (seznam.cz):
  1 email / 3 s, hourly cap 300, daily cap 900 — all tunable via
  `EMAIL_QUEUE_*` env vars (`lib/utils/email-queue.ts`).
- Retry: up to 3 attempts per recipient; permanent SMTP failures (5xx,
  bad address) fail immediately. Failed items can be re-queued from the detail
  page. A stalled queue is recovered by the nightly cron and a resume button.

## Out of scope

- Scheduling sends for a future time
- Saving reusable mass-email templates
- Per-recipient personalization (placeholders) in the composer UI
