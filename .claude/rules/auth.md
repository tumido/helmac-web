---
paths:
  - "lib/auth*"
  - "lib/public-auth*"
  - "app/admin/**"
  - "middleware*"
---

# Authentication

## Two Auth Systems

### 1. Admin Auth (Auth.js / NextAuth v5)

- Credentials provider with email/password
- JWT strategy with 24-hour sessions
- Role-based access control
- Edge-compatible config in `auth.config.ts`

```typescript
import { requireAdmin, requireEditor, requireSuperAdmin } from "@/lib/auth";

// In Server Action or Route Handler
await requireAdmin(); // Throws if not admin
```

### 2. Public User Auth (Custom JWT)

- Custom JWT implementation using `jose` library
- 30-day sessions via httpOnly cookies
- Email verification and password reset flows
- Separate from admin auth

```typescript
import { requirePublicAuth, getPublicSession } from "@/lib/public-auth";

// In public-facing Server Action
const session = await requirePublicAuth(); // Throws if not logged in
// session.sub = user ID, session.email = user email
```

## Role Hierarchy (Admin)

1. `SUPER_ADMIN` - Full access including user management
2. `ADMIN` - Content and year management
3. `EDITOR` - Content editing only

## Environment Variables

- `NEXTAUTH_SECRET` - Admin auth signing (32+ chars)
- `NEXTAUTH_URL` - Auth.js base URL
- `PUBLIC_JWT_SECRET` - Public user JWT signing
