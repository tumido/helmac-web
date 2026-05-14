---
paths:
  - "app/api/**"
---

# API Routes

## Protected API Route

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

## File Upload Pattern

- Check auth first
- Validate file type against `ALLOWED_TYPES` and size against `MAX_FILE_SIZE`
- Sanitize filenames
- Use Cloudflare R2 in production (`process.env.R2_BUCKET_NAME`), local `public/uploads/` in development
