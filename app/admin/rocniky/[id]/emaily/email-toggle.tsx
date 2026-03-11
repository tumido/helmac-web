"use client";

import { useState, useTransition } from "react";
import { Alert, Box, FormControlLabel, Switch } from "@mui/material";
import { toggleConfirmationEmail } from "@/lib/actions/years";

interface EmailToggleProps {
    yearId: string;
    initialEnabled: boolean;
    hasTemplate: boolean;
}

export function EmailToggle({ yearId, initialEnabled, hasTemplate }: EmailToggleProps) {
    const [enabled, setEnabled] = useState(initialEnabled);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleToggle = (checked: boolean) => {
        setError(null);
        startTransition(async () => {
            const result = await toggleConfirmationEmail(yearId, checked);
            if (result && "error" in result && result.error) {
                setError(typeof result.error === "string" ? result.error : "Nepodařilo se změnit stav");
            } else {
                setEnabled(checked);
            }
        });
    };

    return (
        <Box>
            <FormControlLabel
                control={
                    <Switch
                        checked={enabled}
                        onChange={(e) => handleToggle(e.target.checked)}
                        disabled={isPending}
                    />
                }
                label="Odesílat potvrzovací email po registraci"
            />
            {error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    {error}
                </Alert>
            )}
        </Box>
    );
}
