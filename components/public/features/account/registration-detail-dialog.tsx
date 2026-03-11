"use client";

import { useState } from "react";
import {
    Box,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import {
    type FormField,
    type FormElement,
    type AdditionalPersonData,
    type PricingSummaryData,
    getAllFields,
    isInputField,
} from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatPrice } from "@/lib/utils/pricing";

const statusLabels: Record<string, { label: string; color: "default" | "success" | "warning" | "error" | "info" }> = {
    PENDING: { label: "Čeká na potvrzení", color: "warning" },
    CONFIRMED: { label: "Potvrzena", color: "success" },
    WAITLIST: { label: "Čekací listina", color: "info" },
    CANCELLED: { label: "Zrušena", color: "error" },
    REJECTED: { label: "Zamítnuta", color: "error" },
};

interface SerializedRegistration {
    id: string;
    data: unknown;
    status: string;
    isPaid: boolean;
    paidAt: string | null;
    totalPrice: number | null;
    pricingSummary: unknown;
    variableSymbol: string | null;
    createdAt: string;
    year: {
        year: number;
        title: string;
    };
    form: {
        fields: unknown;
    } | null;
}

interface RegistrationHistoryTableProps {
    registrations: SerializedRegistration[];
}

function formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString("cs-CZ");
}

function formatDateValue(value: string | number | boolean): string {
    if (typeof value !== "string") return String(value);
    // Try to parse as date
    const date = new Date(value);
    if (!isNaN(date.getTime()) && value.includes("-")) {
        return date.toLocaleDateString("cs-CZ");
    }
    return value;
}

function getDisplayValue(
    field: FormField,
    data: Record<string, unknown>,
): string | null {
    if (!isInputField(field)) return null;

    const value = data[field.name];
    if (value === undefined || value === null || value === "") return null;

    switch (field.type) {
        case "checkbox":
            return value ? "Ano" : "Ne";
        case "date":
        case "birth_date":
            return formatDateValue(value as string | number | boolean);
        default:
            return String(value);
    }
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
    return (
        <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body1">
                {value}
            </Typography>
        </Box>
    );
}

function renderFields(fields: FormField[], data: Record<string, unknown>) {
    return fields.map((field) => {
        if (field.type === "heading") {
            return (
                <Box key={field.id} sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {field.text}
                    </Typography>
                    <Divider />
                </Box>
            );
        }
        if (field.type === "description") {
            return null;
        }
        const displayValue = getDisplayValue(field, data);
        if (!displayValue) return null;
        return (
            <ReadOnlyField
                key={field.id}
                label={field.label}
                value={displayValue}
            />
        );
    });
}

function RegistrationDetailDialog({
    registration,
    open,
    onClose,
}: {
    registration: SerializedRegistration;
    open: boolean;
    onClose: () => void;
}) {
    const statusInfo = statusLabels[registration.status] || { label: registration.status, color: "default" as const };
    const formData = migrateFormData(registration.form?.fields);
    const allFields = getAllFields(formData.fields as FormElement[]);
    const data = (typeof registration.data === "object" && registration.data !== null ? registration.data : {}) as Record<string, unknown>;
    const additionalPeople = data.additionalPeople as AdditionalPersonData[] | undefined;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="h6" component="span">
                        {registration.year.title}
                    </Typography>
                    <Chip
                        label={statusInfo.label}
                        color={statusInfo.color}
                        size="small"
                    />
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Odesláno {formatDate(registration.createdAt)}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {renderFields(allFields, data)}

                {additionalPeople && additionalPeople.length > 0 && (
                    <>
                        {additionalPeople.map((person, index) => (
                            <Box key={index}>
                                <Box sx={{ mt: 2.5, mb: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        Osoba č. {index + 2}
                                    </Typography>
                                    <Divider />
                                </Box>
                                {renderFields(allFields, person as Record<string, unknown>)}
                            </Box>
                        ))}
                    </>
                )}

                {(() => {
                    const pricingSummary = registration.pricingSummary as PricingSummaryData | null;
                    const hasTiers = pricingSummary && pricingSummary.tiers.length > 0;
                    const hasPrice = registration.totalPrice != null && registration.totalPrice > 0;

                    if (!hasTiers && !hasPrice) return null;

                    return (
                        <Box sx={{ mt: 2.5, pt: 2, borderTop: 1, borderColor: "divider" }}>
                            {hasTiers && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Cenové hladiny
                                    </Typography>
                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mt: 0.5 }}>
                                        {pricingSummary.tiers.map((tier, idx) => {
                                            const isApplicable = idx === pricingSummary.applicableTierIndex;
                                            const label = tier.tierDate
                                                ? `Do ${new Date(tier.tierDate).toLocaleDateString("cs-CZ")}`
                                                : "Na místě";

                                            return (
                                                <Box
                                                    key={idx}
                                                    sx={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={isApplicable ? 700 : 400}
                                                        >
                                                            {label}
                                                        </Typography>
                                                        {isApplicable && (
                                                            <Chip label="Aktuální" size="small" color="primary" />
                                                        )}
                                                    </Box>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={isApplicable ? 700 : 400}
                                                    >
                                                        {formatPrice(tier.totalPrice)}
                                                    </Typography>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}

                            {hasPrice && (
                                <ReadOnlyField
                                    label="Celková cena"
                                    value={formatPrice(registration.totalPrice!)}
                                />
                            )}
                        </Box>
                    );
                })()}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Zavřít</Button>
            </DialogActions>
        </Dialog>
    );
}

export function RegistrationHistoryTable({ registrations }: RegistrationHistoryTableProps) {
    const [selectedRegistration, setSelectedRegistration] = useState<SerializedRegistration | null>(null);

    return (
        <>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ročník</TableCell>
                            <TableCell>Datum</TableCell>
                            <TableCell>Stav</TableCell>
                            <TableCell align="right">Cena</TableCell>
                            <TableCell>Platba</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {registrations.map((reg) => {
                            const statusInfo = statusLabels[reg.status] || { label: reg.status, color: "default" as const };
                            return (
                                <TableRow
                                    key={reg.id}
                                    hover
                                    onClick={() => setSelectedRegistration(reg)}
                                    sx={{ cursor: "pointer" }}
                                >
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {reg.year.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {formatDate(reg.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={statusInfo.label}
                                            color={statusInfo.color}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        {reg.totalPrice ? `${reg.totalPrice} Kč` : "–"}
                                    </TableCell>
                                    <TableCell>
                                        {reg.isPaid ? (
                                            <Chip label="Zaplaceno" color="success" size="small" />
                                        ) : reg.totalPrice ? (
                                            <Chip label="Nezaplaceno" color="warning" size="small" />
                                        ) : (
                                            "–"
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>

            {selectedRegistration && (
                <RegistrationDetailDialog
                    registration={selectedRegistration}
                    open={!!selectedRegistration}
                    onClose={() => setSelectedRegistration(null)}
                />
            )}
        </>
    );
}
