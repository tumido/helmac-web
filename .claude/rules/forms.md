---
paths:
  - "components/forms/**"
---

# Forms (React 19)

Uses `useActionState` from React 19, **NOT** the deprecated `useFormState` from `react-dom`.

## Pattern

```typescript
// components/forms/EntityForm.tsx
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createEntity } from "@/lib/actions/entities";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="contained" disabled={pending}>
            {pending ? <CircularProgress size={24} /> : "Uložit"}
        </Button>
    );
}

export function EntityForm() {
    const [state, formAction] = useActionState(createEntity, null);

    return (
        <Box component="form" action={formAction}>
            {state?.error?._form && (
                <Alert severity="error">{state.error._form[0]}</Alert>
            )}
            <TextField
                name="fieldName"
                error={!!state?.error?.fieldName}
                helperText={state?.error?.fieldName?.[0]}
            />
            <SubmitButton />
        </Box>
    );
}
```
