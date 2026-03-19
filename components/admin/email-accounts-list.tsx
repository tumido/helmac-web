"use client";

import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { EmailAccountCard } from "./email-account-card";
import { EmailAccountForm } from "./email-account-form";

interface EmailAccount {
    id: string;
    email: string;
    label: string | null;
    isMain: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface EmailAccountsListProps {
    accounts: EmailAccount[];
}

export function EmailAccountsList({ accounts }: EmailAccountsListProps) {
    const [formOpen, setFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null);

    const handleEdit = (id: string) => {
        const account = accounts.find((a) => a.id === id);
        if (account) {
            setEditingAccount(account);
        }
    };

    const handleCloseForm = () => {
        setFormOpen(false);
        setEditingAccount(null);
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setFormOpen(true)}
                >
                    Přidat emailový účet
                </Button>
            </Box>

            {accounts.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    Zatím nejsou přidány žádné emailové účty.
                </Typography>
            ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {accounts.map((account) => (
                        <EmailAccountCard
                            key={account.id}
                            account={account}
                            onEdit={handleEdit}
                        />
                    ))}
                </Box>
            )}

            {/* Create dialog */}
            <EmailAccountForm
                mode="create"
                open={formOpen}
                onClose={handleCloseForm}
            />

            {/* Edit dialog */}
            {editingAccount && (
                <EmailAccountForm
                    mode="edit"
                    open={true}
                    onClose={handleCloseForm}
                    account={editingAccount}
                />
            )}
        </Box>
    );
}
