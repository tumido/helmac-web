"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
} from "@mui/material";
import { Delete, ForwardToInbox } from "@mui/icons-material";
import { LinkButton } from "@/components/ui/link-button";
import { EmailToggle } from "./email-toggle";
import { toggleConditionalEmail, deleteConditionalEmail } from "@/lib/actions/conditional-emails";

interface ConditionalEmailCardProps {
    yearId: string;
    email: {
        id: string;
        name: string;
        enabled: boolean;
        conditionFieldName: string;
        conditionFieldLabel: string;
        conditionOperator: string;
        conditionValue: string | null;
        subject: string | null;
        body: string | null;
        account: { email: string; label: string | null } | null;
    };
}

function renderConditionText(
    label: string,
    operator: string,
    value: string | null,
): string {
    if (operator === "is_set") return `${label} – cokoli vybráno`;
    if (operator === "is_not_set") return `${label} – nic nevybráno`;
    if (operator === "quantity_gt_zero") return `${label} – počet pro "${value ?? ""}" > 0`;
    return `${label} = "${value ?? ""}"`;
}

function SenderInfo({ account }: { account: { email: string; label: string | null } | null }) {
    if (account) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Odesílatel: {account.email}{account.label ? ` (${account.label})` : ""}
            </Typography>
        );
    }
    return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Odesílatel: Hlavní emailový účet
        </Typography>
    );
}

export function ConditionalEmailCard({ yearId, email }: ConditionalEmailCardProps) {
    const router = useRouter();
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const hasTemplate = !!email.subject && !!email.body;

    const handleDelete = () => {
        setError(null);
        startTransition(async () => {
            const result = await deleteConditionalEmail(email.id);
            if (result && "error" in result && result.error) {
                setError(typeof result.error === "string" ? result.error : "Nepodařilo se smazat email");
                setDeleteOpen(false);
                return;
            }
            setDeleteOpen(false);
            router.refresh();
        });
    };

    const toggleAction = async (_yearId: string, enabled: boolean) => {
        return toggleConditionalEmail(email.id, enabled);
    };

    return (
        <>
            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <Box>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {email.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Podmínka: {renderConditionText(email.conditionFieldLabel, email.conditionOperator, email.conditionValue)}
                            </Typography>
                        </Box>
                        <Button
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => setDeleteOpen(true)}
                            disabled={isPending}
                        >
                            Smazat
                        </Button>
                    </Box>

                    <EmailToggle
                        yearId={yearId}
                        initialEnabled={email.enabled}
                        hasTemplate={hasTemplate}
                        toggleAction={toggleAction}
                        label="Odesílat tento podmíněný email"
                    />

                    {!hasTemplate && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                            Šablona emailu zatím není nastavena.
                        </Typography>
                    )}

                    {hasTemplate && (
                        <SenderInfo account={email.account} />
                    )}

                    <Box sx={{ mt: 2 }}>
                        <LinkButton
                            href={`/admin/rocniky/${yearId}/emaily/podmineny/${email.id}`}
                            variant="outlined"
                            startIcon={<ForwardToInbox />}
                        >
                            {hasTemplate ? "Zobrazit šablonu" : "Nastavit šablonu"}
                        </LinkButton>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                    )}
                </CardContent>
            </Card>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Smazat podmíněný email</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat podmíněný email &quot;{email.name}&quot;? Tato akce je nevratná.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)} disabled={isPending}>
                        Zrušit
                    </Button>
                    <Button onClick={handleDelete} color="error" disabled={isPending}>
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
