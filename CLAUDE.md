# CLAUDE.md - Project Guidelines for Claude Code

> This file contains rules and conventions for Claude Code to follow when working on this project.

## Project Overview

**Project:** Helmac Web - Yearly recurring event website with admin dashboard
**Type:** Next.js 14 App Router + TypeScript + MUI + PostgreSQL
**Language:** Czech (UI content only), English (code, comments, variables)

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | App Router, Server Components, Server Actions |
| TypeScript | 5.x | Type safety |
| MUI | 5.x | UI components |
| PostgreSQL | - | Database |
| Prisma | 5.x | ORM, migrations |
| Auth.js | 5.x (beta) | Authentication (Credentials provider only) |
| Zod | 3.x | Validation |
| Argon2 | - | Password hashing |

## Code Style

### TypeScript/JavaScript
- **Semicolons:** Always use semicolons
- **Quotes:** Use double quotes for strings (`"hello"`)
- **Indentation:** 4 spaces
- **Trailing commas:** Use in multiline objects/arrays

```typescript
// Good
const config = {
    name: "Helmac",
    year: 2025,
};

// Bad
const config = {
    name: 'Helmac',
    year: 2025
}
```

### Naming Conventions
- **Files:** kebab-case (`admin-drawer.tsx`, `year-form.tsx`)
- **Components:** PascalCase (`AdminDrawer`, `YearForm`)
- **Functions:** camelCase (`createYear`, `getPageBySlug`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `ALLOWED_TYPES`)
- **Database tables:** snake_case via `@@map()` (`users`, `audit_logs`)
- **TypeScript types/interfaces:** PascalCase (`PageContent`, `CreateYearInput`)

### Language in Code
- **Variables, functions, comments:** Always English
- **UI text, labels, messages:** Czech (in strings only)
- **Database content:** Czech

```typescript
// Good - English code, Czech UI text
const errorMessage = "Nepodařilo se vytvořit ročník";
const pageTitle = "Správa ročníků";

// Bad - Czech variable names
const chybovaZprava = "Error";
```

## File Structure

```
app/
├── (public)/           # Public routes (year-based)
├── admin/              # Admin routes (protected)
└── api/                # API routes

components/
├── ui/                 # Shared UI components
├── admin/              # Admin-specific components
└── forms/              # Form components

lib/
├── actions/            # Server Actions (one file per entity)
├── validators/         # Zod schemas (one file per entity)
└── utils/              # Utility functions

prisma/
├── schema.prisma       # Database schema
├── migrations/         # Migration files
└── seed.ts             # Seed script
```

## Component Guidelines

### Server vs Client Components
- **Default to Server Components** - no `"use client"` unless needed
- Use `"use client"` only for:
  - useState, useEffect, useRef hooks
  - Event handlers (onClick, onChange)
  - Browser APIs
  - MUI interactive components

### Component Structure
```typescript
// components/ui/ExampleComponent.tsx
"use client"; // Only if needed

import { useState } from "react";
import { Box, Typography } from "@mui/material";

interface ExampleComponentProps {
  title: string;
  onAction?: () => void;
}

export function ExampleComponent({ title, onAction }: ExampleComponentProps) {
  // Implementation
}
```

### MUI Usage
- Import from `@mui/material` (not individual packages)
- Use `sx` prop for styling (not `style` or `className`)
- Use theme values instead of hardcoded colors

```typescript
// Good
<Box sx={{ p: 2, backgroundColor: "background.paper" }}>

// Bad
<Box style={{ padding: 16, backgroundColor: "#fff" }}>
```

## Server Actions

### Structure
```typescript
// lib/actions/[entity].ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createEntitySchema } from "@/lib/validators/entity";

export async function createEntity(formData: FormData) {
  // 1. Auth check
  await requireAdmin();

  // 2. Parse and validate
  const rawData = { /* ... */ };
  const validated = createEntitySchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  // 3. Database operation
  try {
    const entity = await db.entity.create({ data: validated.data });

    // 4. Revalidate paths
    revalidatePath("/admin/entities");

    return { success: true, data: entity };
  } catch (error) {
    return { error: { _form: ["Operation failed"] } };
  }
}
```

### Rules
- Always validate with Zod before DB operations
- Always check authentication/authorization first
- Return `{ success, data }` or `{ error }` objects
- Use `revalidatePath()` after mutations
- Never expose internal errors to users

## Database (Prisma)

### Schema Conventions
- Use `cuid()` for IDs
- Include `createdAt` and `updatedAt` on all models
- Use `@@map("table_name")` for snake_case table names
- Define relations explicitly

### Migrations
- Run `npx prisma migrate dev --name descriptive-name` for development
- Run `npx prisma migrate deploy` for production
- Never edit migration files manually

### Queries
- Use Prisma Client only (`db.model.method()`)
- Never use `$queryRaw` or `$executeRaw` with user input
- Include only needed fields with `select`
- Use transactions for multi-step operations

## Authentication

### Protected Routes
- Admin routes are protected via middleware
- Use auth helpers in Server Components/Actions:

```typescript
import { requireAdmin, requireEditor, requireSuperAdmin } from "@/lib/auth";

// In Server Action or Route Handler
await requireAdmin(); // Throws if not admin
```

### Role Hierarchy
1. `SUPER_ADMIN` - Full access including user management
2. `ADMIN` - Content and year management
3. `EDITOR` - Content editing only

## Security Rules

### Environment Variables
- Never expose secrets in client code
- Only use `NEXT_PUBLIC_` prefix for truly public values
- Required server-only vars: `DATABASE_URL`, `NEXTAUTH_SECRET`

### Input Validation
- Validate ALL user input with Zod
- Sanitize file names for uploads
- Check file types and sizes

### Passwords
- Always hash with Argon2 (`argon2.hash()`)
- Minimum 8 characters
- Never log or expose passwords

## Git Commits

### Message Style
Use simple descriptive messages:
```
Add login page
Fix year creation validation
Update admin dashboard layout
Remove unused components
```

### Before Committing
- Run `npm run lint` and fix errors
- Run `npm run build` to check for type errors
- Don't commit `.env.local` or secrets

## Important Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npx prisma migrate dev   # Create migration
npx prisma db seed       # Run seed script
npx prisma studio        # Open Prisma Studio

# Build
npm run build            # Production build
npm run lint             # Run ESLint

# Testing
npx playwright test      # Run E2E tests
```

## Safety Rules for Claude

### ALWAYS ASK BEFORE:
- Running `prisma migrate reset` (deletes all data)
- Running `DROP` or `DELETE` SQL commands
- Deleting files or directories
- Modifying `.env` files
- Force pushing to git
- Running destructive npm commands

### NEVER:
- Expose database credentials or secrets
- Skip validation on user input
- Use `dangerouslySetInnerHTML` without sanitization
- Commit sensitive data to git
- Run `--force` flags without explicit permission

## Common Patterns

### Page with Data Fetching
```typescript
// app/admin/entities/page.tsx
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export default async function EntitiesPage() {
  await requireAdmin();

  const entities = await db.entity.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    // JSX
  );
}
```

### Form with Server Action
```typescript
// components/forms/EntityForm.tsx
"use client";

import { useFormState } from "react-dom";
import { createEntity } from "@/lib/actions/entities";

export function EntityForm() {
  const [state, formAction] = useFormState(createEntity, null);

  return (
    <form action={formAction}>
      {/* Form fields */}
      {state?.error && <Alert severity="error">{/* Error display */}</Alert>}
    </form>
  );
}
```

### Protected API Route
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle request
}
```

## Troubleshooting

### Prisma Issues
- Run `npx prisma generate` after schema changes
- Run `npx prisma db push` for quick prototyping (no migration)
- Check `DATABASE_URL` format for PostgreSQL

### Auth.js Issues
- Ensure `NEXTAUTH_SECRET` is set (32+ chars)
- Check `NEXTAUTH_URL` matches your dev URL
- Clear cookies if session issues persist

### MUI SSR Issues
- Wrap app with `AppRouterCacheProvider`
- Use `"use client"` for interactive MUI components
- Import from `@mui/material-nextjs/v14-appRouter`

## Reference Files

- **Implementation Plan:** `PLAN.md`
- **Database Schema:** `prisma/schema.prisma`
- **Auth Config:** `lib/auth.ts`, `lib/auth.config.ts`
- **Theme:** `styles/theme.ts`
