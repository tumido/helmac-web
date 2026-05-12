"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
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
    type InputField,
    type AdditionalPersonData,
    type PricingSummaryData,
    type RegistrationFormData,
    getAllFields,
    isInputField,
} from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatPrice } from "@/lib/utils/pricing";
import { formatDate } from "@/lib/utils/date";
import { DynamicFormField } from "@/components/public/features/registration/DynamicFormField";
import { updatePublicRegistration } from "@/lib/actions/public/registration-edit";

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
        registrationOpen: boolean;
    };
    form: {
        fields: unknown;
    } | null;
}

interface RegistrationHistoryTableProps {
    registrations: SerializedRegistration[];
}

function formatDateValue(value: string | number | boolean): string {
    if (typeof value !== "string") return String(value);
    if (value.includes("-")) {
        const formatted = formatDate(value);
        if (formatted !== "—") return formatted;
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

function isFieldEditable(field: FormField): field is InputField {
    return isInputField(field) && !!field.editable && !field.type.startsWith("pricing_");
}

interface FieldRendererProps {
    fields: FormField[];
    data: Record<string, unknown>;
    isEditing: boolean;
    formData: RegistrationFormData;
    errors?: Record<string, string[]>;
    namePrefix?: string;
    onChange: (name: string, value: string | number | boolean) => void;
}

function FieldRenderer({
    fields,
    data,
    isEditing,
    formData,
    errors,
    namePrefix,
    onChange,
}: FieldRendererProps) {
    return (
        <>
            {fields.map((field) => {
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
                if (isEditing && isFieldEditable(field)) {
                    const value = data[field.name];
                    const normalized: string | number | boolean =
                        typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                            ? value
                            : value == null
                                ? ""
                                : String(value);
                    const fieldError = errors?.[field.name]?.[0];
                    return (
                        <Box key={field.id} sx={{ mb: 1.5 }}>
                            <DynamicFormField
                                field={field}
                                value={normalized}
                                error={fieldError}
                                onChange={onChange}
                                pricingDefinitions={formData.pricingDefinitions}
                                priceTiers={formData.priceTiers}
                                namePrefix={namePrefix}
                            />
                        </Box>
                    );
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
            })}
        </>
    );
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
    const router = useRouter();
    const statusInfo = statusLabels[registration.status] || { label: registration.status, color: "default" as const };
    const formData = migrateFormData(registration.form?.fields);
    const allFields = getAllFields(formData.fields as FormElement[]);
    const originalData = (typeof registration.data === "object" && registration.data !== null
        ? registration.data
        : {}) as Record<string, unknown>;
    const additionalPeopleOriginal = (Array.isArray(originalData.additionalPeople)
        ? originalData.additionalPeople
        : []) as AdditionalPersonData[];

    const hasEditableField = allFields.some(isFieldEditable);
    const canEdit =
        registration.year.registrationOpen &&
        registration.status !== "CANCELLED" &&
        registration.status !== "REJECTED" &&
        hasEditableField;

    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<Record<string, unknown>>(originalData);
    const [editedAP, setEditedAP] = useState<AdditionalPersonData[]>(additionalPeopleOriginal);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [apErrors, setApErrors] = useState<Record<number, Record<string, string[]>>>({});
    const [formMessage, setFormMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const enterEditMode = () => {
        setEditedData(originalData);
        setEditedAP(additionalPeopleOriginal);
        setErrors({});
        setApErrors({});
        setFormMessage(null);
        setIsEditing(true);
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setErrors({});
        setApErrors({});
        setFormMessage(null);
    };

    const handlePrimaryChange = (name: string, value: string | number | boolean) => {
        setEditedData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAPChange = (index: number) => (name: string, value: string | number | boolean) => {
        setEditedAP((prev) => {
            const next = [...prev];
            next[index] = { ...(next[index] ?? {}), [name]: value };
            return next;
        });
    };

    const handleSave = () => {
        const fd = new FormData();
        for (const field of allFields) {
            if (!isFieldEditable(field)) continue;
            const value = editedData[field.name];
            if (field.type === "checkbox") {
                fd.set(field.name, value ? "true" : "false");
            } else {
                fd.set(field.name, value == null ? "" : String(value));
            }
        }
        fd.set("__additionalPeople", JSON.stringify(editedAP ?? []));

        startTransition(async () => {
            const result = await updatePublicRegistration(registration.id, fd);
            if (result.success) {
                setIsEditing(false);
                setErrors({});
                setApErrors({});
                setFormMessage(null);
                router.refresh();
            } else {
                setErrors(result.errors ?? {});
                setApErrors(result.apErrors ?? {});
                setFormMessage(result.message ?? "Uložení selhalo");
            }
        });
    };

    return (
        <Dialog open={open} onClose={isPending ? undefined : onClose} maxWidth="sm" fullWidth>
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
                {formMessage && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {formMessage}
                    </Alert>
                )}

                <FieldRenderer
                    fields={allFields}
                    data={isEditing ? editedData : originalData}
                    isEditing={isEditing}
                    formData={formData}
                    errors={errors}
                    onChange={handlePrimaryChange}
                />

                {(isEditing ? editedAP : additionalPeopleOriginal).map((person, index) => (
                    <Box key={index}>
                        <Box sx={{ mt: 2.5, mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Osoba č. {index + 2}
                            </Typography>
                            <Divider />
                        </Box>
                        <FieldRenderer
                            fields={allFields}
                            data={person as Record<string, unknown>}
                            isEditing={isEditing}
                            formData={formData}
                            errors={apErrors[index]}
                            namePrefix={`ap_${index}_`}
                            onChange={handleAPChange(index)}
                        />
                    </Box>
                ))}

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
                                                ? `Do ${formatDate(tier.tierDate)}`
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
                {isEditing ? (
                    <>
                        <Button onClick={cancelEdit} disabled={isPending}>
                            Zrušit
                        </Button>
                        <Button onClick={handleSave} variant="contained" disabled={isPending}>
                            {isPending ? "Ukládám..." : "Uložit"}
                        </Button>
                    </>
                ) : (
                    <>
                        {canEdit && (
                            <Button onClick={enterEditMode} variant="outlined">
                                Upravit
                            </Button>
                        )}
                        <Button onClick={onClose}>Zavřít</Button>
                    </>
                )}
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
