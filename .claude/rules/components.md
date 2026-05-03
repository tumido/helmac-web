---
paths:
  - "components/**"
---

# Component Guidelines

## Server vs Client Components

- **Default to Server Components** - no `"use client"` unless needed
- Use `"use client"` only for:
  - useState, useEffect, useRef hooks
  - Event handlers (onClick, onChange)
  - Browser APIs
  - MUI interactive components

## Component Structure

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

## MUI Usage

- Import from `@mui/material` (not individual packages)
- Use `sx` prop for styling (not `style` or `className`)
- Use theme values instead of hardcoded colors
- Czech locale applied via `csCZ` from `@mui/material/locale`

```typescript
// Good
<Box sx={{ p: 2, backgroundColor: "background.paper" }}>

// Bad
<Box style={{ padding: 16, backgroundColor: "#fff" }}>
```

## Root Layout

- Wrapped with `AppRouterCacheProvider` from `@mui/material-nextjs/v15-appRouter`
- `DatePickerProvider` for MUI X date pickers
- HTML lang set to `"cs"`
