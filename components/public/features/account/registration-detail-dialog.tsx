"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Chip,
    Collapse,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Button,
    IconButton,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Tabs,
    Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { QRCodeSVG } from "qrcode.react";
import {
    type FormField,
    type FormElement,
    type HeadingField,
    type InputField,
    type AdditionalPersonData,
    type RegistrationFormData,
    getAllFields,
    isInputField,
} from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatPrice } from "@/lib/utils/pricing";
import {
    computePricingLineItems,
    type PricingLineItem,
    type PricingLineGroup,
} from "@/lib/utils/pricing-line-items";
import { formatDate } from "@/lib/utils/date";
import { GameIcon } from "@/lib/icons";
import { resolveSubmissionDataForDisplay } from "@/lib/utils/pricing-display";
import {
    useConditionalFields,
    evaluateAPVisibleFields,
} from "@/components/public/features/registration/useConditionalFields";
import { DynamicFormField } from "@/components/public/features/registration/DynamicFormField";
import { updatePublicRegistration } from "@/lib/actions/public/registration-edit";

const statusLabels: Record<
    string,
    {
        label: string;
        color: "default" | "success" | "warning" | "error" | "info";
    }
> = {
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

interface PaymentInfo {
    bankAccount: string;
    spaydStrings: Record<string, string>;
}

interface RegistrationHistoryTableProps {
    registrations: SerializedRegistration[];
    paymentInfo?: PaymentInfo;
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
    data: Record<string, unknown>
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

function isFieldEditable(field: FormField): field is InputField {
    return (
        isInputField(field) &&
        !!field.editable &&
        !field.type.startsWith("pricing_")
    );
}

function SectionHeadingRow({ text }: { text: string }) {
    return (
        <TableRow>
            <TableCell
                colSpan={2}
                sx={{
                    pt: 3,
                    pb: 1,
                    px: { xs: 2, md: 3 },
                    borderBottom: "none",
                }}
            >
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "primary.main",
                    }}
                >
                    {text}
                </Typography>
            </TableCell>
        </TableRow>
    );
}

interface FieldSection {
    heading: HeadingField | null;
    fields: FormField[];
}

function splitIntoSections(fields: FormField[]): FieldSection[] {
    const sections: FieldSection[] = [];
    let current: FieldSection = { heading: null, fields: [] };
    for (const field of fields) {
        if (field.type === "heading") {
            if (current.heading || current.fields.length > 0) {
                sections.push(current);
            }
            current = { heading: field, fields: [] };
        } else if (field.type !== "description") {
            current.fields.push(field);
        }
    }
    if (current.heading || current.fields.length > 0) {
        sections.push(current);
    }
    return sections;
}

function FieldTableRows({
    fields,
    data,
    apOnly,
}: {
    fields: FormField[];
    data: Record<string, unknown>;
    apOnly?: boolean;
}) {
    const sections = splitIntoSections(fields);
    return (
        <>
            {sections.map((section) => {
                const visibleFields = section.fields
                    .filter(isInputField)
                    .filter(
                        (f) =>
                            (!apOnly ||
                                f.includeForAdditionalPeople) &&
                            getDisplayValue(f, data) !== null,
                    );
                if (visibleFields.length === 0) return null;
                return (
                    <React.Fragment
                        key={section.heading?.id ?? visibleFields[0].id}
                    >
                        {section.heading && (
                            <SectionHeadingRow text={section.heading.text} />
                        )}
                        {visibleFields.map((field) => (
                            <TableRow key={field.id}>
                                <TableCell
                                    sx={{
                                        color: "text.secondary",
                                        whiteSpace: "nowrap",
                                        width: "1%",
                                        px: { xs: 2, md: 3 },
                                        py: 1,
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                        verticalAlign: "top",
                                    }}
                                >
                                    {field.label}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        px: { xs: 2, md: 3 },
                                        py: 1,
                                        borderBottom: "1px solid",
                                        borderColor: "divider",
                                    }}
                                >
                                    {getDisplayValue(field, data)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </React.Fragment>
                );
            })}
        </>
    );
}

function EditableFieldTableRows({
    fields,
    data,
    formData,
    errors,
    namePrefix,
    onChange,
    visibleFields,
    apOnly,
}: {
    fields: FormField[];
    data: Record<string, unknown>;
    formData: RegistrationFormData;
    errors?: Record<string, string[]>;
    namePrefix?: string;
    onChange: (name: string, value: string | number | boolean) => void;
    visibleFields?: Set<string>;
    apOnly?: boolean;
}) {
    const sections = splitIntoSections(fields);
    return (
        <>
            {sections.map((section) => {
                const editableFields = section.fields
                    .filter(isFieldEditable)
                    .filter(
                        (f) =>
                            (!visibleFields ||
                                visibleFields.has(f.id)) &&
                            (!apOnly ||
                                f.includeForAdditionalPeople),
                    );
                if (editableFields.length === 0) return null;
                return (
                    <React.Fragment
                        key={section.heading?.id ?? editableFields[0].id}
                    >
                        {section.heading && (
                            <SectionHeadingRow text={section.heading.text} />
                        )}
                        {editableFields.map((field) => {
                            const value = data[field.name];
                            const normalized: string | number | boolean =
                                typeof value === "string" ||
                                typeof value === "number" ||
                                typeof value === "boolean"
                                    ? value
                                    : value == null
                                      ? ""
                                      : String(value);
                            const fieldError = errors?.[field.name]?.[0];
                            return (
                                <TableRow key={field.id}>
                                    <TableCell
                                        sx={{
                                            color: "text.secondary",
                                            whiteSpace: "nowrap",
                                            width: "1%",
                                            px: {
                                                xs: 2,
                                                md: 3,
                                            },
                                            py: 1,
                                            borderBottom: "1px solid",
                                            borderColor: "divider",
                                            verticalAlign: "top",
                                            pt: 2.5,
                                        }}
                                    >
                                        {field.label}
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            px: {
                                                xs: 2,
                                                md: 3,
                                            },
                                            py: 1,
                                            borderBottom: "1px solid",
                                            borderColor: "divider",
                                        }}
                                    >
                                        <DynamicFormField
                                            field={field}
                                            value={normalized}
                                            error={fieldError}
                                            onChange={onChange}
                                            pricingDefinitions={
                                                formData.pricingDefinitions
                                            }
                                            priceTiers={formData.priceTiers}
                                            namePrefix={namePrefix}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </React.Fragment>
                );
            })}
        </>
    );
}

function RegistrationViewDialog({
    registration,
    open,
    onClose,
}: {
    registration: SerializedRegistration;
    open: boolean;
    onClose: () => void;
}) {
    const formData = migrateFormData(registration.form?.fields);
    const allFields = getAllFields(formData.fields as FormElement[]);
    const originalData = (
        typeof registration.data === "object" && registration.data !== null
            ? registration.data
            : {}
    ) as Record<string, unknown>;
    const additionalPeople = (
        Array.isArray(originalData.additionalPeople)
            ? originalData.additionalPeople
            : []
    ) as AdditionalPersonData[];

    const hasTabs = additionalPeople.length > 0;
    const [activeTab, setActiveTab] = useState(0);

    const inputFields = allFields.filter(isInputField);
    const resolve = (data: Record<string, unknown>) =>
        resolveSubmissionDataForDisplay(
            data,
            inputFields,
            formData.pricingDefinitions ?? []
        );

    const people: { label: string; data: Record<string, unknown> }[] = [
        { label: "Hlavní osoba", data: resolve(originalData) },
        ...additionalPeople.map((p, i) => ({
            label: `Osoba č. ${i + 2}`,
            data: resolve(p as Record<string, unknown>),
        })),
    ];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                variant: "outlined",
                elevation: 0,
                sx: {
                    borderRadius: 2,
                    height: "calc(100% - 64px)",
                    maxHeight: "calc(100% - 64px)",
                },
            }}
        >
            <DialogTitle sx={{ pb: 0 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                            }}
                        >
                            <Typography
                                variant="body1"
                                fontWeight={600}
                                component="span"
                            >
                                {registration.year.title}
                            </Typography>
                            <Chip
                                label={
                                    statusLabels[registration.status]?.label ??
                                    registration.status
                                }
                                color={
                                    statusLabels[registration.status]?.color ??
                                    "default"
                                }
                                size="small"
                            />
                            {registration.isPaid ? (
                                <Chip
                                    icon={<GameIcon name="wax-seal" />}
                                    label="Zaplaceno"
                                    size="small"
                                    sx={{
                                        backgroundColor: "background.paper",
                                        color: "text.primary",
                                        "& .MuiChip-icon": {
                                            color: "text.primary",
                                        },
                                    }}
                                />
                            ) : registration.totalPrice ? (
                                <Chip
                                    icon={<GameIcon name="empty-hourglass" />}
                                    label="Nezaplaceno"
                                    color="warning"
                                    size="small"
                                />
                            ) : null}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {formatDate(registration.createdAt)}
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {hasTabs && (
                    <Tabs
                        value={activeTab}
                        onChange={(_, v) => setActiveTab(v)}
                        sx={{ px: { xs: 2, md: 3 }, pt: 1 }}
                    >
                        {people.map((p, i) => (
                            <Tab key={i} label={p.label} />
                        ))}
                    </Tabs>
                )}

                <Table size="small">
                    <TableBody>
                        <FieldTableRows
                            fields={allFields}
                            data={people[activeTab].data}
                            apOnly={activeTab > 0}
                        />
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Zavřít</Button>
            </DialogActions>
        </Dialog>
    );
}

function RegistrationEditDialog({
    registration,
    open,
    onClose,
}: {
    registration: SerializedRegistration;
    open: boolean;
    onClose: () => void;
}) {
    const router = useRouter();
    const formData = migrateFormData(registration.form?.fields);
    const allFields = getAllFields(formData.fields as FormElement[]);
    const originalData = (
        typeof registration.data === "object" && registration.data !== null
            ? registration.data
            : {}
    ) as Record<string, unknown>;
    const additionalPeopleOriginal = (
        Array.isArray(originalData.additionalPeople)
            ? originalData.additionalPeople
            : []
    ) as AdditionalPersonData[];

    const [editedData, setEditedData] =
        useState<Record<string, unknown>>(originalData);
    const [editedAP, setEditedAP] = useState<AdditionalPersonData[]>(
        additionalPeopleOriginal
    );
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [apErrors, setApErrors] = useState<
        Record<number, Record<string, string[]>>
    >({});
    const [formMessage, setFormMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [editTab, setEditTab] = useState(0);

    const { visibleFields: mainVisibleFields } = useConditionalFields(
        formData,
        editedData as Record<string, string | number | boolean>,
    );
    const apVisibleFields = editedAP.map((person) =>
        evaluateAPVisibleFields(
            formData,
            person as Record<string, string | number | boolean>,
        ),
    );

    const handlePrimaryChange = (
        name: string,
        value: string | number | boolean
    ) => {
        setEditedData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAPChange =
        (index: number) => (name: string, value: string | number | boolean) => {
            setEditedAP((prev) => {
                const next = [...prev];
                next[index] = {
                    ...(next[index] ?? {}),
                    [name]: value,
                };
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
                setErrors({});
                setApErrors({});
                setFormMessage(null);
                router.refresh();
                onClose();
            } else {
                setErrors(result.errors ?? {});
                setApErrors(result.apErrors ?? {});
                setFormMessage(result.message ?? "Uložení selhalo");
            }
        });
    };

    return (
        <Dialog
            open={open}
            onClose={isPending ? undefined : onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                variant: "outlined",
                elevation: 0,
                sx: {
                    borderRadius: 2,
                    height: "calc(100% - 64px)",
                    maxHeight: "calc(100% - 64px)",
                },
            }}
        >
            <DialogTitle sx={{ pb: 0 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                            }}
                        >
                            <Typography
                                variant="body1"
                                fontWeight={600}
                                component="span"
                            >
                                {registration.year.title}
                            </Typography>
                            <Chip
                                label={
                                    statusLabels[registration.status]?.label ??
                                    registration.status
                                }
                                color={
                                    statusLabels[registration.status]?.color ??
                                    "default"
                                }
                                size="small"
                            />
                            {registration.isPaid ? (
                                <Chip
                                    icon={<GameIcon name="wax-seal" />}
                                    label="Zaplaceno"
                                    size="small"
                                    sx={{
                                        backgroundColor: "background.paper",
                                        color: "text.primary",
                                        "& .MuiChip-icon": {
                                            color: "text.primary",
                                        },
                                    }}
                                />
                            ) : registration.totalPrice ? (
                                <Chip
                                    icon={<GameIcon name="empty-hourglass" />}
                                    label="Nezaplaceno"
                                    color="warning"
                                    size="small"
                                />
                            ) : null}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            {formatDate(registration.createdAt)}
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
                {formMessage && (
                    <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
                        {formMessage}
                    </Alert>
                )}

                {editedAP.length > 0 && (
                    <Tabs
                        value={editTab}
                        onChange={(_, v) => setEditTab(v)}
                        sx={{ px: { xs: 2, md: 3 }, pt: 1 }}
                    >
                        <Tab label="Hlavní osoba" />
                        {editedAP.map((_, i) => (
                            <Tab
                                key={i}
                                label={`Osoba č. ${i + 2}`}
                            />
                        ))}
                    </Tabs>
                )}

                <Table size="small">
                    <TableBody>
                        {editTab === 0 ? (
                            <EditableFieldTableRows
                                fields={allFields}
                                data={editedData}
                                formData={formData}
                                errors={errors}
                                onChange={handlePrimaryChange}
                                visibleFields={mainVisibleFields}
                            />
                        ) : (
                            <EditableFieldTableRows
                                fields={allFields}
                                data={
                                    (editedAP[editTab - 1] ??
                                        {}) as Record<
                                        string,
                                        unknown
                                    >
                                }
                                formData={formData}
                                errors={apErrors[editTab - 1]}
                                namePrefix={`ap_${editTab - 1}_`}
                                onChange={handleAPChange(
                                    editTab - 1,
                                )}
                                visibleFields={
                                    apVisibleFields[editTab - 1]
                                }
                                apOnly
                            />
                        )}
                    </TableBody>
                </Table>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isPending}>
                    Zrušit
                </Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    disabled={isPending}
                >
                    {isPending ? "Ukládám..." : "Uložit"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function PriceBreakdown({
    mainLines,
    apLines,
    totalPrice,
}: {
    mainLines: PricingLineItem[];
    apLines: PricingLineGroup[];
    totalPrice: number | null;
}) {
    const hasAP = apLines.some((g) => g.lines.length > 0);
    const hasLines = mainLines.length > 0 || hasAP;

    if (!hasLines && !totalPrice) return null;

    return (
        <Box>
            <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ color: "primary.main", mb: 1.5 }}
            >
                Rozpis ceny
            </Typography>
            {mainLines.length > 0 && (
                <Box sx={{ mb: 1.5 }}>
                    {hasAP && (
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{
                                mb: 0.5,
                                pb: 0.5,
                                borderBottom: "1px solid",
                                borderColor: "divider",
                                color: "primary.main",
                            }}
                        >
                            Hlavní osoba
                        </Typography>
                    )}
                    {mainLines.map((line, i) => (
                        <Box
                            key={i}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "baseline",
                                gap: 1,
                                mb: 0.75,
                            }}
                        >
                            <Typography variant="body2">
                                {line.label}: {line.optionName}
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={500}
                                noWrap
                                sx={{ flexShrink: 0 }}
                            >
                                {formatPrice(line.price)}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            )}

            {apLines.map((group) =>
                group.lines.length === 0 ? null : (
                    <Box key={group.personIndex} sx={{ mb: 1.5 }}>
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{
                                mb: 0.5,
                                pb: 0.5,
                                borderBottom: "1px solid",
                                borderColor: "divider",
                                color: "primary.main",
                            }}
                        >
                            Osoba č. {group.personIndex + 2}
                        </Typography>
                        {group.lines.map((line, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "baseline",
                                    gap: 1,
                                    mb: 0.75,
                                }}
                            >
                                <Typography variant="body2">
                                    {line.label}: {line.optionName}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    fontWeight={500}
                                    noWrap
                                    sx={{ flexShrink: 0 }}
                                >
                                    {formatPrice(line.price)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )
            )}

            {totalPrice != null && totalPrice > 0 && (
                <>
                    <Divider sx={{ my: 1.5 }} />
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: 2,
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                            Celkem
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                            {formatPrice(totalPrice)}
                        </Typography>
                    </Box>
                </>
            )}
        </Box>
    );
}

function InlinePayment({
    spaydString,
    amount,
    bankAccount,
    variableSymbol,
}: {
    spaydString: string;
    amount: number;
    bankAccount: string;
    variableSymbol: string;
}) {
    return (
        <Box
            sx={{
                mt: { xs: 2, md: 0 },
                p: { xs: 2, md: 3 },
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "center", sm: "flex-start" },
                gap: { xs: 2, sm: 3 },
            }}
        >
            <Box
                sx={{
                    p: 1.5,
                    backgroundColor: "#fff",
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <QRCodeSVG value={spaydString} size={120} level="M" />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    textAlign: { xs: "center", sm: "left" },
                }}
            >
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ color: "primary.main" }}
                >
                    Platba převodem
                </Typography>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Částka
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                        {formatPrice(amount)}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Číslo účtu
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ fontFamily: "monospace" }}
                    >
                        {bankAccount}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Variabilní symbol
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{
                            fontFamily: "monospace",
                            letterSpacing: 2,
                        }}
                    >
                        {variableSymbol}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}

export function RegistrationHistoryTable({
    registrations,
    paymentInfo,
}: RegistrationHistoryTableProps) {
    const [expandedId, setExpandedId] = useState<string | null>(
        registrations[0]?.id ?? null
    );
    const [selectedRegistration, setSelectedRegistration] =
        useState<SerializedRegistration | null>(null);
    const [openInEditMode, setOpenInEditMode] = useState(false);

    const toggleExpand = (id: string) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
                {registrations.map((reg, index) => {
                    const formData = migrateFormData(reg.form?.fields);
                    const data = (
                        typeof reg.data === "object" && reg.data !== null
                            ? reg.data
                            : {}
                    ) as Record<string, unknown>;
                    const additionalPeople = (
                        Array.isArray(data.additionalPeople)
                            ? data.additionalPeople
                            : []
                    ) as AdditionalPersonData[];
                    const { mainLines, apLines } = computePricingLineItems(
                        formData,
                        data,
                        additionalPeople
                    );
                    const hasLineItems =
                        mainLines.length > 0 ||
                        apLines.some((g) => g.lines.length > 0);
                    const spaydString = paymentInfo?.spaydStrings[reg.id];
                    const showPayment =
                        !reg.isPaid &&
                        reg.variableSymbol &&
                        paymentInfo &&
                        spaydString;
                    const isExpanded = expandedId === reg.id;
                    const hasExpandableContent = hasLineItems || showPayment;
                    const allFields = getAllFields(
                        formData.fields as FormElement[]
                    );
                    const canEdit =
                        reg.year.registrationOpen &&
                        reg.status !== "CANCELLED" &&
                        reg.status !== "REJECTED" &&
                        allFields.some(isFieldEditable);

                    return (
                        <Box key={reg.id}>
                            {index > 0 && <Divider />}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    px: { xs: 2, md: 3 },
                                    py: 2,
                                    cursor: "pointer",
                                    transition: "background-color 0.15s",
                                    "&:hover": {
                                        backgroundColor: "action.hover",
                                    },
                                }}
                                onClick={() => toggleExpand(reg.id)}
                            >
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            fontWeight={600}
                                            component="span"
                                        >
                                            {reg.year.title}
                                        </Typography>
                                        <Chip
                                            label={
                                                statusLabels[reg.status]
                                                    ?.label ?? reg.status
                                            }
                                            color={
                                                statusLabels[reg.status]
                                                    ?.color ?? "default"
                                            }
                                            size="small"
                                        />
                                        {reg.isPaid ? (
                                            <Chip
                                                icon={
                                                    <GameIcon name="wax-seal" />
                                                }
                                                label="Zaplaceno"
                                                size="small"
                                                sx={{
                                                    backgroundColor:
                                                        "background.paper",
                                                    color: "text.primary",
                                                    "& .MuiChip-icon": {
                                                        color: "text.primary",
                                                    },
                                                }}
                                            />
                                        ) : reg.totalPrice ? (
                                            <Chip
                                                icon={
                                                    <GameIcon name="empty-hourglass" />
                                                }
                                                label="Nezaplaceno"
                                                color="warning"
                                                size="small"
                                            />
                                        ) : null}
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {formatDate(reg.createdAt)}
                                    </Typography>
                                </Box>
                                {reg.totalPrice != null &&
                                    reg.totalPrice > 0 && (
                                        <Typography
                                            variant="body1"
                                            fontWeight={600}
                                            noWrap
                                            sx={{ flexShrink: 0 }}
                                        >
                                            {formatPrice(reg.totalPrice)}
                                        </Typography>
                                    )}
                                <IconButton
                                    size="small"
                                    sx={{
                                        transform: isExpanded
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                        transition: "transform 0.2s",
                                        flexShrink: 0,
                                    }}
                                >
                                    <ExpandMore />
                                </IconButton>
                            </Box>

                            <Collapse in={isExpanded}>
                                <Box
                                    sx={{
                                        px: { xs: 2, md: 3 },
                                        pb: 3,
                                    }}
                                >
                                    {hasExpandableContent && (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: {
                                                    xs: "column",
                                                    md: "row",
                                                },
                                                gap: { xs: 0, md: 4 },
                                                mb: 2,
                                            }}
                                        >
                                            {hasLineItems && (
                                                <Box
                                                    sx={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        py: showPayment
                                                            ? {
                                                                  xs: 0,
                                                                  md: 3,
                                                              }
                                                            : 0,
                                                    }}
                                                >
                                                    <PriceBreakdown
                                                        mainLines={mainLines}
                                                        apLines={apLines}
                                                        totalPrice={
                                                            reg.totalPrice
                                                        }
                                                    />
                                                </Box>
                                            )}
                                            {showPayment && (
                                                <Box
                                                    sx={{
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <InlinePayment
                                                        spaydString={
                                                            spaydString
                                                        }
                                                        amount={reg.totalPrice!}
                                                        bankAccount={
                                                            paymentInfo.bankAccount
                                                        }
                                                        variableSymbol={
                                                            reg.variableSymbol!
                                                        }
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            gap: 1.5,
                                        }}
                                    >
                                        {canEdit && (
                                            <Button
                                                variant="contained"
                                                onClick={() => {
                                                    setOpenInEditMode(true);
                                                    setSelectedRegistration(
                                                        reg
                                                    );
                                                }}
                                            >
                                                Upravit data
                                            </Button>
                                        )}
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setOpenInEditMode(false);
                                                setSelectedRegistration(reg);
                                            }}
                                        >
                                            Zobrazit
                                        </Button>
                                    </Box>
                                </Box>
                            </Collapse>
                        </Box>
                    );
                })}
            </Box>

            {selectedRegistration && !openInEditMode && (
                <RegistrationViewDialog
                    registration={selectedRegistration}
                    open
                    onClose={() => setSelectedRegistration(null)}
                />
            )}
            {selectedRegistration && openInEditMode && (
                <RegistrationEditDialog
                    registration={selectedRegistration}
                    open
                    onClose={() => {
                        setSelectedRegistration(null);
                        setOpenInEditMode(false);
                    }}
                />
            )}
        </>
    );
}
