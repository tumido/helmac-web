---
paths:
  - "lib/utils/encryption*"
  - "lib/validators/**"
  - ".env*"
---

# Security

## Environment Variables

- Never expose secrets in client code
- Only use `NEXT_PUBLIC_` prefix for truly public values
- Required server-only vars:
  - `DATABASE_URL` - PostgreSQL connection
  - `NEXTAUTH_SECRET` - Admin auth signing (32+ chars)
  - `PUBLIC_JWT_SECRET` - Public user JWT signing
  - `ENCRYPTION_KEY` - AES-256 key for email account passwords (64-char hex)
- Optional vars:
  - `DIRECT_URL` - Direct database connection for Prisma
  - `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage
  - `CRON_SECRET` - Bearer token for cron endpoints

## Input Validation

- Validate ALL user input with Zod
- Sanitize file names for uploads
- Check file types and sizes

## Passwords

- Always hash with Argon2 (`argon2.hash()`)
- Minimum 8 characters
- Never log or expose passwords

## Encryption

- Email account passwords encrypted with AES-256 (`lib/utils/encryption.ts`)
- Uses `ENCRYPTION_KEY` environment variable
