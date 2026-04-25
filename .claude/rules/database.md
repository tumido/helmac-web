---
paths:
  - "prisma/**"
---

# Database (Prisma)

## Schema Conventions

- Use `cuid()` for IDs
- Include `createdAt` and `updatedAt` on all models
- Use `@@map("table_name")` for snake_case table names
- Define relations explicitly
- Use `Json` type for flexible/dynamic data (form definitions, submissions, pricing)

## Migrations

- Run `npm run db:migrate` (or `npx prisma migrate dev --name descriptive-name`)
- Run `npx prisma migrate deploy` for production
- Never edit migration files manually

## Queries

- Use Prisma Client only (`db.model.method()`)
- Never use `$queryRaw` or `$executeRaw` with user input
- Include only needed fields with `select`
- Use transactions for multi-step operations
