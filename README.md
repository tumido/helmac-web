# Helmac Web

Yearly recurring event website with admin dashboard. Built with Next.js 16, React 19, MUI 5, Prisma, and PostgreSQL.

## Development Setup

### 1. Database

Start PostgreSQL via Docker Compose:

```bash
docker compose up -d
```

This runs Postgres 16 on `localhost:5432` (user: `helmac`, password: `helmac123`, db: `helmac`).

### 2. Environment

```bash
cat > .env.local <<EOF
DATABASE_URL="postgresql://helmac:helmac123@localhost:5432/helmac?schema=public"
DIRECT_URL="postgresql://helmac:helmac123@localhost:5432/helmac?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
PUBLIC_JWT_SECRET="$(openssl rand -base64 32)"
CRON_SECRET="$(openssl rand -base64 32)"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
NODE_ENV="development"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
EOF
```

### 3. Install and seed

```bash
npm install
npm run db:migrate       # apply migrations
npm run db:seed          # seed initial data
```

### 4. Run

```bash
npm run dev              # starts on http://localhost:3000
```

Admin login: `admin@helmac.cz` / `admin123456` at [localhost:3000/admin](http://localhost:3000/admin)

## Other Commands

```bash
npm run build            # production build (runs migrations first)
npm run lint             # ESLint
npm run db:studio        # Prisma Studio (DB browser)
npx playwright test      # E2E tests
```
