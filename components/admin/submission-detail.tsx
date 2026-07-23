"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Box,
    Button,
    TextField,
    FormControlLabel,
    Checkbox,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Radio,
    Typography,
    Alert,
    IconButton,
    Chip,
    Tab,
    Tabs,
    Divider,
    CircularProgress,
    Switch,
    Grid,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material";
import { Save, Delete, Person } from "@mui/icons-material";
import type {
    OrderDetailPerson,
    V2PricingDef,
} from "@/lib/services/v2";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllFields } from "@/lib/types/registration-form";
import type { RegistrationFormData, FormField as LegacyFormField } from "@/lib/types/registration-form";
import { useConditionalFields } from "@/components/public/features/registration/useConditionalFields";
import {
    updateSubmissionData,
    updateSubmissionStatus,
    toggleSubmissionPayment,
    deleteSubmission,
    resendConfirmationEmail,
} from "@/lib/actions/registration-submissions";
import type { RegistrationStatus } from "@prisma/client";
import type { PricingSummaryData } from "@/lib/types/registration-form";
import { SubmissionPricingSummary } from "@/components/admin/submission-pricing-summary";
import { AdminNoteDetail } from "@/components/admin/admin-note-detail";

// ---- Constants ----

const STATUS_OPTIONS: {
    value: RegistrationStatus;
    label: string;
}[] = [
    { value: "PENDING", label: "Čeká" },
    { value: "CONFIRMED", label: "Potvrzeno" },
    { value: "WAITLIST", label: "Čekací listina" },
    { value: "CANCELLED", label: "Zrušeno" },
    { value: "REJECTED", label: "Zamítnuto" },
];

// ---- Types ----

interface FieldMeta {
    id: string;
    name: string;
    label: string;
    type: string;
    isActive: boolean;
    options: string[];
    pricingDefinitionId: string | null;
    includeForAP: boolean;
    sortOrder: number;
}

interface PersonState {
    personIndex: number;
    values: Record<string, string>;
    quantities: Record<string, Record<string, number>>;
    multiSelects: Record<string, string[]>;
}

interface FormSection {
    heading: string | null;
    fieldNames: string[];
}

interface SerializedOrder {
    id: string;
    legacySubmissionId: string | null;
    status: RegistrationStatus;
    isPaid: boolean;
    paidAt: string | null;
    totalPrice: number | null;
    variableSymbol: string | null;
    emailSent: boolean;
    emailSentAt: string | null;
    adminNote: string | null;
    isTest: boolean;
    createdAt: string;
    yearId: string;
    yearNumber: number;
    yearTitle: string;
    pricingSummary: unknown;
    people: OrderDetailPerson[];
    pricingDefinitions: V2PricingDef[];
    priceTiers: { id: string; deadline: string | null; sortOrder: number }[];
    formLayout: unknown;
    allFields: {
        id: string;
        name: string;
        label: string;
        type: string;
        isActive: boolean;
        sortOrder: number;
        options: string[];
        pricingDefinitionId: string | null;
        includeForAdditionalPeople: boolean;
    }[];
}

export interface SubmissionDetailProps {
    order: SerializedOrder;
    yearId: string;
    readOnly: boolean;
}

// ---- Helpers ----

function buildPersonState(
    person: OrderDetailPerson,
): PersonState {
    const values: Record<string, string> = {};
    const quantities: Record<
        string,
        Record<string, number>
    > = {};
    const multiSelects: Record<string, string[]> = {};

    for (const li of person.lineItems) {
        const name = li.fieldName;
        if (
            li.fieldType === "pricing_quantity" &&
            li.pricingOptionId
        ) {
            if (!quantities[name]) quantities[name] = {};
            quantities[name][li.pricingOptionId] =
                li.quantity;
        } else if (
            li.fieldType === "pricing_multi_select" &&
            li.pricingOptionId
        ) {
            if (!multiSelects[name])
                multiSelects[name] = [];
            multiSelects[name].push(li.pricingOptionId);
        } else if (
            li.fieldType === "pricing_select" &&
            li.pricingOptionId
        ) {
            values[name] = li.pricingOptionId;
        } else {
            values[name] = li.value ?? "";
        }
    }

    return {
        personIndex: person.personIndex,
        values,
        quantities,
        multiSelects,
    };
}

function buildFields(order: SerializedOrder): FieldMeta[] {
    const byName = new Map(
        order.allFields.map((f) => [
            f.name,
            {
                ...f,
                includeForAP:
                    f.includeForAdditionalPeople,
            },
        ]),
    );
    for (const person of order.people) {
        for (const li of person.lineItems) {
            if (byName.has(li.fieldName)) continue;
            byName.set(li.fieldName, {
                id: li.fieldId,
                name: li.fieldName,
                label: li.fieldLabel,
                type: li.fieldType,
                isActive: li.fieldIsActive,
                sortOrder: li.fieldSortOrder,
                options: li.fieldOptions,
                pricingDefinitionId:
                    li.fieldPricingDefinitionId,
                includeForAP: li.fieldIncludeForAP,
                includeForAdditionalPeople:
                    li.fieldIncludeForAP,
            });
        }
    }
    return Array.from(byName.values()).sort(
        (a, b) => a.sortOrder - b.sortOrder,
    );
}

function extractSections(
    layout: unknown,
    fieldNames: Set<string>,
): FormSection[] {
    const sections: FormSection[] = [];
    let current: FormSection = {
        heading: null,
        fieldNames: [],
    };

    function walk(elements: unknown[]) {
        for (const el of elements) {
            if (!el || typeof el !== "object") continue;
            const obj = el as Record<string, unknown>;
            if (obj.type === "heading") {
                if (current.fieldNames.length > 0) {
                    sections.push(current);
                }
                current = {
                    heading: String(obj.text ?? ""),
                    fieldNames: [],
                };
            } else if (
                obj.type === "condition" &&
                Array.isArray(obj.children)
            ) {
                walk(obj.children);
            } else if (
                obj.name &&
                typeof obj.name === "string" &&
                fieldNames.has(obj.name)
            ) {
                current.fieldNames.push(obj.name);
            }
        }
    }

    if (layout && typeof layout === "object") {
        const raw = layout as Record<string, unknown>;
        if (Array.isArray(raw.fields)) {
            walk(raw.fields);
        }
    }

    if (current.fieldNames.length > 0) {
        sections.push(current);
    }

    return sections;
}

function personStateToLegacyData(
    state: PersonState,
    fields: FieldMeta[],
): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const field of fields) {
        switch (field.type) {
            case "checkbox":
                data[field.name] =
                    state.values[field.name] === "true";
                break;
            case "pricing_quantity":
                data[field.name] = JSON.stringify(
                    state.quantities[field.name] ?? {},
                );
                break;
            case "pricing_multi_select":
                data[field.name] = JSON.stringify(
                    state.multiSelects[field.name] ?? [],
                );
                break;
            default:
                data[field.name] =
                    state.values[field.name] ?? "";
                break;
        }
    }
    return data;
}

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("cs-CZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getCurrentTierId(
    priceTiers: SerializedOrder["priceTiers"],
): string | null {
    if (priceTiers.length === 0) return null;
    const now = new Date();
    for (const tier of priceTiers) {
        if (tier.deadline && now <= new Date(tier.deadline)) {
            return tier.id;
        }
    }
    return priceTiers[priceTiers.length - 1].id;
}

function computeTotal(
    personStates: PersonState[],
    fields: FieldMeta[],
    pricingDefById: Map<string, V2PricingDef>,
    currentTierId: string | null,
    visibleFields?: Set<string>,
): number {
    let total = 0;
    for (const state of personStates) {
        for (const field of fields) {
            if (!field.pricingDefinitionId) continue;
            if (visibleFields && !visibleFields.has(field.name)) continue;
            const def = pricingDefById.get(
                field.pricingDefinitionId,
            );
            if (!def) continue;

            const optionPrice = (optId: string) => {
                const opt = def.options.find(
                    (o) => o.id === optId,
                );
                if (!opt || opt.prices.length === 0)
                    return 0;
                if (currentTierId) {
                    const tierPrice = opt.prices.find(
                        (p) => p.tierId === currentTierId,
                    );
                    if (tierPrice) return tierPrice.price;
                }
                return (
                    opt.prices[opt.prices.length - 1]
                        ?.price ?? 0
                );
            };

            switch (field.type) {
                case "pricing_select": {
                    const val =
                        state.values[field.name] ?? "";
                    if (val) total += optionPrice(val);
                    break;
                }
                case "pricing_multi_select": {
                    const selected =
                        state.multiSelects[field.name] ??
                        [];
                    for (const optId of selected) {
                        total += optionPrice(optId);
                    }
                    break;
                }
                case "pricing_quantity": {
                    const qtys =
                        state.quantities[field.name] ??
                        {};
                    for (const [optId, qty] of Object.entries(qtys)) {
                        total +=
                            optionPrice(optId) * qty;
                    }
                    break;
                }
            }
        }
    }
    return total;
}

// ---- Field Renderer ----

function FieldRenderer({
    field,
    value,
    quantities,
    multiSelected,
    pricingDef,
    onChange,
    onQuantityChange,
    onMultiSelectChange,
    disabled,
}: {
    field: FieldMeta;
    value: string;
    quantities?: Record<string, number>;
    multiSelected?: string[];
    pricingDef?: V2PricingDef;
    onChange: (value: string) => void;
    onQuantityChange?: (
        optionId: string,
        qty: number,
    ) => void;
    onMultiSelectChange?: (selected: string[]) => void;
    disabled: boolean;
}) {
    const label = field.isActive ? (
        field.label
    ) : (
        <Box
            component="span"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 1,
            }}
        >
            {field.label}
            <Chip
                label="Zrušené pole"
                size="small"
                variant="outlined"
                color="default"
                sx={{ height: 20, fontSize: "0.7rem" }}
            />
        </Box>
    );

    switch (field.type) {
        case "checkbox":
            return (
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={value === "true"}
                            onChange={(e) =>
                                onChange(
                                    String(
                                        e.target.checked,
                                    ),
                                )
                            }
                            disabled={disabled}
                        />
                    }
                    label={label}
                />
            );

        case "select":
            return (
                <FormControl fullWidth size="small">
                    <InputLabel>{label}</InputLabel>
                    <Select
                        value={value}
                        onChange={(e) =>
                            onChange(
                                e.target.value as string,
                            )
                        }
                        label={field.label}
                        disabled={disabled}
                    >
                        {field.options.map((opt) => (
                            <MenuItem
                                key={opt}
                                value={opt}
                            >
                                {opt}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            );

        case "radio":
        case "pricing_select": {
            const options =
                field.type === "pricing_select"
                    ? (pricingDef?.options ?? []).map(
                          (o) => ({
                              id: o.id,
                              label: o.name,
                          }),
                      )
                    : field.options.map((o) => ({
                          id: o,
                          label: o,
                      }));
            const cols = Math.min(options.length, 3);
            return (
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                    >
                        {label}
                    </Typography>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: `repeat(${cols}, 1fr)`,
                            },
                            gap: 1,
                        }}
                    >
                        {options.map((opt) => {
                            const isSelected =
                                value === opt.id;
                            return (
                                <Box
                                    key={opt.id}
                                    onClick={() =>
                                        !disabled &&
                                        onChange(opt.id)
                                    }
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        gap: 1,
                                        px: 2,
                                        py: 1.5,
                                        border: "2px solid",
                                        borderColor:
                                            isSelected
                                                ? "primary.main"
                                                : "divider",
                                        borderRadius: 1,
                                        cursor: disabled
                                            ? "default"
                                            : "pointer",
                                        opacity: disabled
                                            ? 0.6
                                            : 1,
                                        transition:
                                            "all 0.2s ease",
                                        "&:hover":
                                            disabled
                                                ? {}
                                                : {
                                                      borderColor:
                                                          isSelected
                                                              ? "primary.main"
                                                              : "action.selected",
                                                  },
                                    }}
                                >
                                    <Radio
                                        size="small"
                                        checked={
                                            isSelected
                                        }
                                        disabled={
                                            disabled
                                        }
                                        sx={{ p: 0 }}
                                        tabIndex={-1}
                                    />
                                    <Typography
                                        variant="body1"
                                        fontWeight={
                                            isSelected
                                                ? 600
                                                : 400
                                        }
                                    >
                                        {opt.label}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            );
        }

        case "pricing_quantity": {
            const options = pricingDef?.options ?? [];
            const cols = Math.min(options.length, 3);
            return (
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                    >
                        {label}
                    </Typography>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: `repeat(${cols}, 1fr)`,
                            },
                            gap: 1,
                        }}
                    >
                        {options.map((opt) => {
                            const qty =
                                quantities?.[opt.id] ?? 0;
                            return (
                                <Box
                                    key={opt.id}
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        justifyContent:
                                            "space-between",
                                        gap: 1.5,
                                        px: 2,
                                        py: 1,
                                        border: "2px solid",
                                        borderColor:
                                            qty > 0
                                                ? "primary.main"
                                                : "divider",
                                        borderRadius: 1,
                                        opacity: disabled
                                            ? 0.6
                                            : 1,
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        fontWeight={
                                            qty > 0
                                                ? 600
                                                : 400
                                        }
                                    >
                                        {opt.name}
                                    </Typography>
                                    <TextField
                                        type="number"
                                        value={String(
                                            qty,
                                        )}
                                        onChange={(e) => {
                                            const n =
                                                Math.max(
                                                    0,
                                                    Math.floor(
                                                        Number(
                                                            e
                                                                .target
                                                                .value,
                                                        ) ||
                                                            0,
                                                    ),
                                                );
                                            onQuantityChange?.(
                                                opt.id,
                                                n,
                                            );
                                        }}
                                        size="small"
                                        inputProps={{
                                            min: 0,
                                            step: 1,
                                        }}
                                        disabled={
                                            disabled
                                        }
                                        sx={{
                                            width: 80,
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            );
        }

        case "pricing_multi_select": {
            const msOptions =
                pricingDef?.options ?? [];
            const cols = Math.min(msOptions.length, 3);
            return (
                <Box>
                    <Typography
                        variant="body2"
                        sx={{ mb: 1 }}
                    >
                        {label}
                    </Typography>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                sm: `repeat(${cols}, 1fr)`,
                            },
                            gap: 1,
                        }}
                    >
                        {msOptions.map((opt) => {
                            const isSelected =
                                multiSelected?.includes(
                                    opt.id,
                                ) ?? false;
                            return (
                                <Box
                                    key={opt.id}
                                    onClick={() => {
                                        if (disabled)
                                            return;
                                        const next =
                                            isSelected
                                                ? (
                                                      multiSelected ??
                                                      []
                                                  ).filter(
                                                      (
                                                          s,
                                                      ) =>
                                                          s !==
                                                          opt.id,
                                                  )
                                                : [
                                                      ...(multiSelected ??
                                                          []),
                                                      opt.id,
                                                  ];
                                        onMultiSelectChange?.(
                                            next,
                                        );
                                    }}
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        gap: 1,
                                        px: 2,
                                        py: 1.5,
                                        border: "2px solid",
                                        borderColor:
                                            isSelected
                                                ? "primary.main"
                                                : "divider",
                                        borderRadius: 1,
                                        cursor: disabled
                                            ? "default"
                                            : "pointer",
                                        opacity: disabled
                                            ? 0.6
                                            : 1,
                                        transition:
                                            "all 0.2s ease",
                                        "&:hover":
                                            disabled
                                                ? {}
                                                : {
                                                      borderColor:
                                                          isSelected
                                                              ? "primary.main"
                                                              : "action.selected",
                                                  },
                                    }}
                                >
                                    <Checkbox
                                        size="small"
                                        checked={
                                            isSelected
                                        }
                                        disabled={
                                            disabled
                                        }
                                        sx={{ p: 0 }}
                                        tabIndex={-1}
                                    />
                                    <Typography
                                        variant="body1"
                                        fontWeight={
                                            isSelected
                                                ? 600
                                                : 400
                                        }
                                    >
                                        {opt.name}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            );
        }

        case "textarea":
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    multiline
                    rows={3}
                    fullWidth
                    size="small"
                    disabled={disabled}
                />
            );

        default:
            return (
                <TextField
                    label={label}
                    value={value}
                    onChange={(e) =>
                        onChange(e.target.value)
                    }
                    type={
                        field.type === "email"
                            ? "email"
                            : field.type === "number"
                              ? "number"
                              : field.type === "date" ||
                                  field.type ===
                                      "birth_date"
                                ? "date"
                                : "text"
                    }
                    fullWidth
                    size="small"
                    InputLabelProps={
                        field.type === "date" ||
                        field.type === "birth_date"
                            ? { shrink: true }
                            : undefined
                    }
                    disabled={disabled}
                />
            );
    }
}

// ---- Main Component ----

export function SubmissionDetail({
    order,
    yearId,
    readOnly,
}: SubmissionDetailProps) {
    const router = useRouter();
    const fields = useMemo(
        () => buildFields(order),
        [order],
    );
    const fieldByName = useMemo(
        () => new Map(fields.map((f) => [f.name, f])),
        [fields],
    );
    const pricingDefById = useMemo(
        () =>
            new Map(
                order.pricingDefinitions.map((d) => [
                    d.id,
                    d,
                ]),
            ),
        [order.pricingDefinitions],
    );

    const [initialStates] = useState<PersonState[]>(() =>
        order.people.map(buildPersonState),
    );
    const [personStates, setPersonStates] = useState<
        PersonState[]
    >(() => order.people.map(buildPersonState));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(
        null,
    );
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [currentStatus, setCurrentStatus] = useState(
        order.status,
    );
    const [currentPaid, setCurrentPaid] = useState(
        order.isPaid,
    );
    const [actionLoading, setActionLoading] =
        useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [emailSending, setEmailSending] = useState(false);

    const isLoading = saving || actionLoading;

    const currentTierId = useMemo(
        () => getCurrentTierId(order.priceTiers),
        [order.priceTiers],
    );
    const apFields = fields.filter(
        (f) => f.includeForAP,
    );

    const formData = useMemo((): RegistrationFormData | null => {
        if (!order.formLayout) return null;
        return migrateFormData(order.formLayout);
    }, [order.formLayout]);

    const mainValues = useMemo(() => {
        const state = personStates[0];
        if (!state) return {} as Record<string, string | number | boolean>;
        return personStateToLegacyData(state, fields) as Record<string, string | number | boolean>;
    }, [personStates, fields]);

    const { visibleFields } = useConditionalFields(
        formData ?? { fields: [], conditions: [], pricingDefinitions: [], capacityLimits: [], showOptionCounts: [], priceTiers: [] },
        mainValues,
    );

    const allFieldNames = useMemo(
        () => new Set(fields.map((f) => f.name)),
        [fields],
    );
    const apFieldNames = useMemo(
        () => new Set(apFields.map((f) => f.name)),
        [apFields],
    );

    const visibleFieldNames = useMemo(() => {
        if (!formData) return allFieldNames;
        const legacyFields = getAllFields(formData.fields);
        const idToName = new Map(
            legacyFields
                .filter((f): f is LegacyFormField & { name: string } => "name" in f)
                .map((f) => [f.id, (f as { name: string }).name]),
        );
        const names = new Set<string>();
        for (const id of visibleFields) {
            const name = idToName.get(id);
            if (name) names.add(name);
        }
        return names;
    }, [formData, visibleFields, allFieldNames]);

    const computedPrice = useMemo(
        () =>
            computeTotal(
                personStates,
                fields,
                pricingDefById,
                currentTierId,
                visibleFieldNames,
            ),
        [personStates, fields, pricingDefById, currentTierId, visibleFieldNames],
    );
    const originalPrice = useMemo(
        () =>
            computeTotal(
                initialStates,
                fields,
                pricingDefById,
                currentTierId,
            ),
        [initialStates, fields, pricingDefById, currentTierId],
    );

    const mainSections = extractSections(
        order.formLayout,
        allFieldNames,
    );
    const apSections = extractSections(
        order.formLayout,
        apFieldNames,
    );
    const layoutFieldNames = new Set(
        mainSections.flatMap((s) => s.fieldNames),
    );
    const archivedFields = fields.filter(
        (f) =>
            !f.isActive || !layoutFieldNames.has(f.name),
    );

    // ---- State updaters ----

    const updateValue = (
        personIdx: number,
        fieldName: string,
        value: string,
    ) => {
        setPersonStates((prev) => {
            const updated = [...prev];
            updated[personIdx] = {
                ...updated[personIdx],
                values: {
                    ...updated[personIdx].values,
                    [fieldName]: value,
                },
            };
            return updated;
        });
    };

    const updateQuantity = (
        personIdx: number,
        fieldName: string,
        optionId: string,
        qty: number,
    ) => {
        setPersonStates((prev) => {
            const updated = [...prev];
            const fieldQty = {
                ...(updated[personIdx].quantities[
                    fieldName
                ] ?? {}),
            };
            if (qty > 0) {
                fieldQty[optionId] = qty;
            } else {
                delete fieldQty[optionId];
            }
            updated[personIdx] = {
                ...updated[personIdx],
                quantities: {
                    ...updated[personIdx].quantities,
                    [fieldName]: fieldQty,
                },
            };
            return updated;
        });
    };

    const updateMultiSelect = (
        personIdx: number,
        fieldName: string,
        selected: string[],
    ) => {
        setPersonStates((prev) => {
            const updated = [...prev];
            updated[personIdx] = {
                ...updated[personIdx],
                multiSelects: {
                    ...updated[personIdx].multiSelects,
                    [fieldName]: selected,
                },
            };
            return updated;
        });
    };

    const handleRemovePerson = (personIdx: number) => {
        setPersonStates((prev) =>
            prev.filter((_, i) => i !== personIdx),
        );
        if (activeTab >= personStates.length - 1) {
            setActiveTab(
                Math.max(0, personStates.length - 2),
            );
        }
    };

    // ---- Actions ----

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const mainState = personStates[0];
        const mainData = mainState
            ? personStateToLegacyData(mainState, fields)
            : {};

        const apStates = personStates.slice(1);
        if (apStates.length > 0) {
            mainData.additionalPeople = apStates.map(
                (s) =>
                    personStateToLegacyData(s, apFields),
            );
        }

        const result = await updateSubmissionData(
            order.legacySubmissionId!,
            mainData,
        );

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    const handleStatusChange = async (
        newStatus: RegistrationStatus,
    ) => {
        setActionLoading(true);
        setError(null);
        const result = await updateSubmissionStatus(
            order.legacySubmissionId!,
            newStatus,
        );
        if (result.error) {
            setError(result.error);
        } else {
            setCurrentStatus(newStatus);
        }
        setActionLoading(false);
    };

    const handlePaymentToggle = async () => {
        setActionLoading(true);
        setError(null);
        const newPaid = !currentPaid;
        const result = await toggleSubmissionPayment(
            order.legacySubmissionId!,
            newPaid,
        );
        if (result.error) {
            setError(result.error);
        } else {
            setCurrentPaid(newPaid);
        }
        setActionLoading(false);
    };

    const handleDelete = async () => {
        setDeleteOpen(false);
        setActionLoading(true);
        const result = await deleteSubmission(
            order.legacySubmissionId!,
        );
        if (result.error) {
            setError(result.error);
            setActionLoading(false);
        } else {
            router.push(
                `/admin/rocniky/${yearId}/registrace/prihlasky`,
            );
        }
    };

    const handleResendEmail = async () => {
        setEmailSending(true);
        setError(null);
        const result = await resendConfirmationEmail(
            order.legacySubmissionId!,
        );
        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setEmailSending(false);
    };

    // ---- Render helpers ----

    const renderField = (
        field: FieldMeta,
        state: PersonState,
        personIdx: number,
    ) => (
        <FieldRenderer
            key={field.id}
            field={field}
            value={state.values[field.name] ?? ""}
            quantities={state.quantities[field.name]}
            multiSelected={
                state.multiSelects[field.name]
            }
            pricingDef={
                field.pricingDefinitionId
                    ? pricingDefById.get(
                          field.pricingDefinitionId,
                      ) ?? undefined
                    : undefined
            }
            onChange={(v) =>
                updateValue(personIdx, field.name, v)
            }
            onQuantityChange={(optId, qty) =>
                updateQuantity(
                    personIdx,
                    field.name,
                    optId,
                    qty,
                )
            }
            onMultiSelectChange={(sel) =>
                updateMultiSelect(
                    personIdx,
                    field.name,
                    sel,
                )
            }
            disabled={readOnly || !field.isActive}
        />
    );

    const renderSections = (
        sections: FormSection[],
        archived: FieldMeta[],
        state: PersonState,
        personIdx: number,
        visibleFields: Set<string>,
    ) => (
        <Box
            component="fieldset"
            disabled={readOnly}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                border: "none",
                p: 0,
                m: 0,
                minWidth: 0,
            }}
        >
            {sections.map((section, sIdx) => (
                <Box key={sIdx}>
                    {section.heading && (
                        <>
                            {sIdx > 0 && (
                                <Divider
                                    sx={{ mb: 2 }}
                                />
                            )}
                            <Typography
                                variant="subtitle1"
                                fontWeight={600}
                                sx={{ mb: 1.5 }}
                            >
                                {section.heading}
                            </Typography>
                        </>
                    )}
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        {section.fieldNames
                            .map((name) =>
                                fieldByName.get(name),
                            )
                            .filter(
                                (f): f is FieldMeta =>
                                    !!f &&
                                    visibleFields.has(
                                        f.name,
                                    ),
                            )
                            .map((field) =>
                                renderField(
                                    field,
                                    state,
                                    personIdx,
                                ),
                            )}
                    </Box>
                </Box>
            ))}

            {archived.length > 0 && (
                <Box>
                    <Divider sx={{ mb: 2 }} />
                    <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        color="text.secondary"
                        sx={{ mb: 1.5 }}
                    >
                        Zrušená pole
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        {archived.map((field) =>
                            renderField(
                                field,
                                state,
                                personIdx,
                            ),
                        )}
                    </Box>
                </Box>
            )}
        </Box>
    );

    const personLabel = (idx: number) =>
        idx === 0
            ? "Hlavní osoba"
            : `Osoba č. ${idx + 1}`;

    // ---- Render ----

    return (
        <Box>
            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Data byla uložena
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left: form data */}
                <Grid item xs={12} md={8}>
                    {order.isTest && (
                        <Chip
                            label="TEST"
                            color="warning"
                            size="small"
                            variant="outlined"
                            sx={{
                                fontWeight: 700,
                                mb: 2,
                            }}
                        />
                    )}

                    {personStates.length > 1 && (
                        <Tabs
                            value={activeTab}
                            onChange={(_, v: number) =>
                                setActiveTab(v)
                            }
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                borderBottom: 1,
                                borderColor: "divider",
                                mb: 2,
                            }}
                        >
                            {personStates.map(
                                (_, idx) => (
                                    <Tab
                                        key={idx}
                                        icon={
                                            <Person fontSize="small" />
                                        }
                                        iconPosition="start"
                                        label={
                                            <Box
                                                sx={{
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    gap: 1,
                                                }}
                                            >
                                                {personLabel(
                                                    idx,
                                                )}
                                                {idx >
                                                    0 &&
                                                    !readOnly && (
                                                        <Box
                                                            component="span"
                                                            onClick={(
                                                                e: React.MouseEvent,
                                                            ) => {
                                                                e.stopPropagation();
                                                                handleRemovePerson(
                                                                    idx,
                                                                );
                                                            }}
                                                            sx={{
                                                                ml: 0.5,
                                                                display:
                                                                    "inline-flex",
                                                                cursor: "pointer",
                                                                color: "error.main",
                                                                "&:hover":
                                                                    {
                                                                        opacity: 0.7,
                                                                    },
                                                            }}
                                                        >
                                                            <Delete
                                                                sx={{
                                                                    fontSize: 16,
                                                                }}
                                                            />
                                                        </Box>
                                                    )}
                                            </Box>
                                        }
                                        sx={{
                                            minHeight: 48,
                                        }}
                                    />
                                ),
                            )}
                        </Tabs>
                    )}

                    {personStates.map((state, idx) => (
                        <Paper
                            key={idx}
                            role="tabpanel"
                            hidden={
                                personStates.length > 1 &&
                                activeTab !== idx
                            }
                            sx={{ p: 3 }}
                        >
                            {renderSections(
                                idx === 0
                                    ? mainSections
                                    : apSections,
                                idx === 0
                                    ? archivedFields
                                    : archivedFields.filter(
                                          (f) =>
                                              f.includeForAP,
                                      ),
                                state,
                                idx,
                                visibleFieldNames,
                            )}
                        </Paper>
                    ))}
                </Grid>

                {/* Right: sidebar */}
                <Grid item xs={12} md={4}>
                    {/* Save / Delete */}
                    {!readOnly && (
                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                                justifyContent:
                                    "flex-end",
                                mb: 3,
                            }}
                        >
                            <Button
                                variant="contained"
                                startIcon={
                                    saving ? (
                                        <CircularProgress
                                            size={20}
                                            color="inherit"
                                        />
                                    ) : (
                                        <Save />
                                    )
                                }
                                onClick={handleSave}
                                disabled={isLoading}
                            >
                                {saving
                                    ? "Ukládám..."
                                    : "Uložit změny"}
                            </Button>
                            <IconButton
                                color="error"
                                onClick={() =>
                                    setDeleteOpen(true)
                                }
                                disabled={isLoading}
                                size="small"
                            >
                                <Delete />
                            </IconButton>
                        </Box>
                    )}

                    {/* Platba */}
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography
                            variant="h6"
                            sx={{ mb: 2 }}
                        >
                            Platba
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Vytvořeno:{" "}
                                {formatDateTime(
                                    order.createdAt,
                                )}
                            </Typography>
                            {order.paidAt && (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Zaplaceno:{" "}
                                    {formatDateTime(
                                        order.paidAt,
                                    )}
                                </Typography>
                            )}
                        </Box>
                        <SubmissionPricingSummary
                            pricingSummary={
                                order.pricingSummary as PricingSummaryData | null
                            }
                            variableSymbol={
                                order.variableSymbol
                            }
                            totalPrice={computedPrice}
                            priceDiff={
                                computedPrice -
                                originalPrice
                            }
                        />
                        {!readOnly && (
                            <Box
                                sx={{
                                    display: "flex",
                                    gap: 1.5,
                                    alignItems: "center",
                                    mt: 2,
                                    pt: 2,
                                    borderTop: 1,
                                    borderColor:
                                        "divider",
                                }}
                            >
                                <FormControl
                                    size="small"
                                    sx={{ flex: 1 }}
                                >
                                    <InputLabel>
                                        Stav
                                    </InputLabel>
                                    <Select
                                        value={
                                            currentStatus
                                        }
                                        onChange={(e) =>
                                            handleStatusChange(
                                                e.target
                                                    .value as RegistrationStatus,
                                            )
                                        }
                                        label="Stav"
                                        disabled={
                                            isLoading
                                        }
                                    >
                                        {STATUS_OPTIONS.map(
                                            (opt) => (
                                                <MenuItem
                                                    key={
                                                        opt.value
                                                    }
                                                    value={
                                                        opt.value
                                                    }
                                                >
                                                    {
                                                        opt.label
                                                    }
                                                </MenuItem>
                                            ),
                                        )}
                                    </Select>
                                </FormControl>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={
                                                currentPaid
                                            }
                                            onChange={
                                                handlePaymentToggle
                                            }
                                            disabled={
                                                isLoading
                                            }
                                            color="success"
                                            size="small"
                                        />
                                    }
                                    label={
                                        currentPaid
                                            ? "Zaplaceno"
                                            : "Nezaplaceno"
                                    }
                                    sx={{ mr: 0 }}
                                />
                            </Box>
                        )}
                    </Paper>

                    {/* Email */}
                    {!readOnly && (
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{ mb: 2 }}
                            >
                                Potvrzovací email
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                {order.emailSent ? (
                                    <Chip
                                        label={`Odesláno${order.emailSentAt ? ` ${formatDateTime(order.emailSentAt)}` : ""}`}
                                        color="success"
                                        size="small"
                                        variant="outlined"
                                    />
                                ) : (
                                    <Chip
                                        label="Neodesláno"
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={
                                        handleResendEmail
                                    }
                                    disabled={
                                        emailSending
                                    }
                                >
                                    {emailSending
                                        ? "Odesílám..."
                                        : order.emailSent
                                          ? "Znovu odeslat"
                                          : "Odeslat email"}
                                </Button>
                            </Box>
                        </Paper>
                    )}

                    {/* Admin note */}
                    {!readOnly && (
                        <Paper sx={{ p: 3 }}>
                            <Typography
                                variant="h6"
                                sx={{ mb: 2 }}
                            >
                                Poznámka admina
                            </Typography>
                            <AdminNoteDetail
                                submissionId={
                                    order.legacySubmissionId!
                                }
                                adminNote={
                                    order.adminNote
                                }
                            />
                        </Paper>
                    )}
                </Grid>
            </Grid>

            {/* Delete dialog */}
            <Dialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
            >
                <DialogTitle>
                    Smazat registraci?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Tato akce je nevratná. Registrace
                        bude trvale odstraněna.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() =>
                            setDeleteOpen(false)
                        }
                    >
                        Zrušit
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                    >
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
