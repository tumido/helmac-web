"use client";

import {
    useState,
    useCallback,
    useMemo,
    useEffect,
    useActionState,
    type FormEvent,
} from "react";
import {
    Box,
    Button,
    Alert,
    Snackbar,
    Paper,
    FormControlLabel,
    Checkbox,
    FormHelperText,
    Fade,
    Typography,
} from "@mui/material";
import MuiLink from "@mui/material/Link";
import NextLink from "next/link";
import { DecorativeDivider, AnimatedSection } from "@/components/public/ui";
import type {
    RegistrationFormData,
    SubmissionData,
    OptionCounts,
    AdditionalPersonData,
    FormField,
} from "@/lib/types/registration-form";
import {
    isInputField,
    getAllFields,
    getAllInputFields,
    getAPInputFields,
    hasAdditionalPeopleFields,
    getDisabledOptionsForField,
} from "@/lib/types/registration-form";
import { DynamicFormField } from "./DynamicFormField";
import { RegistrationSuccess } from "./RegistrationSuccess";
import {
    useConditionalFields,
    evaluateAPVisibleFields,
} from "./useConditionalFields";
import { AdditionalPeopleSection } from "./AdditionalPeopleSection";
import { PriceSummary } from "./PriceSummary";
import { FormProgress } from "./FormProgress";
import { StickyPriceSummary } from "./StickyPriceSummary";
import {
    buildMergedDataForAP,
    getAPFieldNames,
} from "@/lib/utils/additional-people";
import {
    submitDynamicRegistration,
    type RegistrationState,
} from "@/lib/actions/public/registration";

interface DynamicRegistrationFormProps {
    formData: RegistrationFormData;
    optionCounts?: OptionCounts;
    previewMode?: boolean;
    isLoggedIn?: boolean;
    publicEmail?: string;
}

function buildInitialValues(
    formData: RegistrationFormData,
    publicEmail?: string
): SubmissionData {
    const values: SubmissionData = {};
    const inputFields = getAllInputFields(formData.fields);
    for (const field of inputFields) {
        if (field.type === "checkbox") {
            values[field.name] = false;
        } else if (field.type === "pricing_quantity") {
            values[field.name] = "{}";
        } else if (field.type === "pricing_multi_select") {
            values[field.name] = "[]";
        } else if (field.type === "email" && publicEmail) {
            values[field.name] = publicEmail;
        } else {
            values[field.name] = "";
        }
    }
    return values;
}

export function DynamicRegistrationForm({
    formData,
    optionCounts,
    previewMode,
    isLoggedIn,
    publicEmail,
}: DynamicRegistrationFormProps) {
    const [values, setValues] = useState<SubmissionData>(() =>
        buildInitialValues(formData, publicEmail)
    );
    const [additionalPeople, setAdditionalPeople] = useState<
        AdditionalPersonData[]
    >([]);
    const { visibleFields } = useConditionalFields(formData, values);
    const [gdprConsent, setGdprConsent] = useState(false);
    const [previewSnackbar, setPreviewSnackbar] = useState(false);

    const [state, formAction, isPending] = useActionState<
        RegistrationState | null,
        FormData
    >(submitDynamicRegistration, null);

    const handleChange = useCallback(
        (name: string, value: string | number | boolean) => {
            setValues((prev) => ({ ...prev, [name]: value }));
        },
        []
    );

    const getFieldError = useCallback(
        (name: string): string | undefined => {
            return state?.errors?.[name]?.[0];
        },
        [state?.errors]
    );

    const handlePreviewSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        setPreviewSnackbar(true);
    }, []);

    // Auto-select single enabled option for pricing_select, select, and radio fields
    useEffect(() => {
        const inputFields = getAllInputFields(formData.fields);
        const updates: Record<string, string> = {};

        for (const field of inputFields) {
            if (!visibleFields.has(field.id)) continue;

            if (field.type === "pricing_select" && field.pricingId) {
                const def = formData.pricingDefinitions.find(
                    (d) => d.id === field.pricingId
                );
                if (!def) continue;
                const disabledOpts = getDisabledOptionsForField(
                    field.id,
                    field.name,
                    formData.capacityLimits,
                    optionCounts
                );
                const enabledOptions = def.options.filter(
                    (o) => !disabledOpts.has(o.name)
                );
                if (enabledOptions.length === 1) {
                    updates[field.name] = enabledOptions[0].name;
                }
            } else if (field.type === "select" || field.type === "radio") {
                if (!field.options || field.options.length === 0) continue;
                const disabledOpts = getDisabledOptionsForField(
                    field.id,
                    field.name,
                    formData.capacityLimits,
                    optionCounts
                );
                const enabledOptions = field.options.filter(
                    (o) => !disabledOpts.has(o)
                );
                if (enabledOptions.length === 1) {
                    updates[field.name] = enabledOptions[0];
                }
            }
        }

        if (Object.keys(updates).length > 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-select single enabled option based on capacity constraints
            setValues((prev) => {
                const next = { ...prev };
                let changed = false;
                for (const [name, value] of Object.entries(updates)) {
                    if (prev[name] === "" || prev[name] === undefined) {
                        next[name] = value;
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }
    }, [visibleFields, formData, optionCounts]);

    // Flatten all fields for rendering (preserving order from elements)
    const allFields = getAllFields(formData.fields);
    const allInputFields = getAllInputFields(formData.fields);
    const showAPSection = hasAdditionalPeopleFields(formData.fields);
    const apFields = showAPSection ? getAPInputFields(formData.fields) : [];

    // Group fields into sections based on heading fields
    const sections = useMemo(() => {
        const result: {
            heading: FormField | null;
            fields: FormField[];
        }[] = [];
        let current: { heading: FormField | null; fields: FormField[] } = {
            heading: null,
            fields: [],
        };
        for (const field of allFields) {
            if (!visibleFields.has(field.id)) continue;
            if (!isInputField(field) && field.type === "heading") {
                if (current.fields.length > 0 || current.heading) {
                    result.push(current);
                }
                current = { heading: field, fields: [] };
            } else {
                current.fields.push(field);
            }
        }
        if (current.fields.length > 0 || current.heading) {
            result.push(current);
        }
        return result;
    }, [allFields, visibleFields]);

    // Extract progress sections from headings
    const progressSections = useMemo(() => {
        return sections
            .filter(
                (s) =>
                    s.heading &&
                    !isInputField(s.heading) &&
                    s.fields.length > 0
            )
            .map((s) => ({
                id: `section-${s.heading!.id}`,
                label: (
                    s.heading as { type: "heading"; text: string }
                ).text,
            }));
    }, [sections]);

    const allRequiredFilled = useMemo(() => {
        for (const field of allInputFields) {
            if (!field.required || !visibleFields.has(field.id))
                continue;
            const val = values[field.name];
            if (
                val === undefined ||
                val === "" ||
                val === false
            )
                return false;
        }
        if (!isLoggedIn && !previewMode && !gdprConsent)
            return false;
        return true;
    }, [
        allInputFields,
        visibleFields,
        values,
        isLoggedIn,
        previewMode,
        gdprConsent,
    ]);

    // Compute visible AP fields per person for price summary
    const visibleAPFieldsPerPerson = useMemo(() => {
        if (!showAPSection) return [];
        const apNames = getAPFieldNames(formData.fields);
        return additionalPeople.map((person) => {
            const merged = buildMergedDataForAP(values, person, apNames);
            return evaluateAPVisibleFields(formData, merged);
        });
    }, [showAPSection, additionalPeople, values, formData]);

    if (!previewMode && state?.success) {
        return (
            <RegistrationSuccess
                message={state.message}
                variableSymbol={state.variableSymbol}
                totalPrice={state.totalPrice}
                paymentData={state.paymentData}
            />
        );
    }

    const hasPricing = formData.pricingDefinitions.length > 0;

    const priceSummaryProps = {
        pricingDefinitions: formData.pricingDefinitions,
        priceTiers: formData.priceTiers ?? [],
        allInputFields,
        mainValues: values,
        additionalPeople,
        visibleMainFields: visibleFields,
        visibleAPFieldsPerPerson,
    };

    return (
        <Box sx={{ display: { md: "flex" }, gap: 4 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ p: { xs: 0, md: 2 } }}>
                    <FormProgress sections={progressSections} />
                    <Box
                        id="registration-form"
                        component="form"
                        action={previewMode ? undefined : formAction}
                        onSubmit={
                            previewMode
                                ? handlePreviewSubmit
                                : undefined
                        }
                    >
                        {/* Include checkbox values as hidden inputs for FormData */}
                        {allInputFields.map((field) => {
                            if (field.type === "checkbox") {
                                return (
                                    <input
                                        key={`hidden-${field.name}`}
                                        type="hidden"
                                        name={field.name}
                                        value={String(
                                            values[field.name] ??
                                                false
                                        )}
                                    />
                                );
                            }
                            return null;
                        })}

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                    }}
                >
                    {sections.map((section, sectionIdx) => (
                        <AnimatedSection
                            key={
                                section.heading?.id ??
                                `section-${sectionIdx}`
                            }
                            delay={sectionIdx * 100}
                        >
                            {section.heading && (
                                <DynamicFormField
                                    field={section.heading}
                                    value=""
                                    onChange={handleChange}
                                    pricingDefinitions={
                                        formData.pricingDefinitions
                                    }
                                    priceTiers={formData.priceTiers}
                                />
                            )}
                            {section.fields.length > 0 && (
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2.5,
                                        p: { xs: 2, md: 3 },
                                        borderRadius: 2,
                                    }}
                                >
                                    {section.fields.map(
                                        (field) => {
                                            const value =
                                                isInputField(field)
                                                    ? (values[
                                                          field.name
                                                      ] ?? "")
                                                    : "";
                                            const disabledOpts =
                                                isInputField(field)
                                                    ? getDisabledOptionsForField(
                                                          field.id,
                                                          field.name,
                                                          formData.capacityLimits,
                                                          optionCounts
                                                      )
                                                    : undefined;

                                            return (
                                                <Fade
                                                    key={field.id}
                                                    in
                                                    timeout={300}
                                                >
                                                    <Box>
                                                        <DynamicFormField
                                                            field={
                                                                field
                                                            }
                                                            value={
                                                                value
                                                            }
                                                            error={
                                                                isInputField(
                                                                    field
                                                                )
                                                                    ? getFieldError(
                                                                          field.name
                                                                      )
                                                                    : undefined
                                                            }
                                                            onChange={
                                                                handleChange
                                                            }
                                                            pricingDefinitions={
                                                                formData.pricingDefinitions
                                                            }
                                                            priceTiers={
                                                                formData.priceTiers
                                                            }
                                                            disabledOptions={
                                                                disabledOpts
                                                            }
                                                        />
                                                    </Box>
                                                </Fade>
                                            );
                                        }
                                    )}
                                </Paper>
                            )}
                        </AnimatedSection>
                    ))}
                </Box>

                {showAPSection && (
                    <AdditionalPeopleSection
                        formData={formData}
                        apFields={apFields}
                        mainValues={values}
                        optionCounts={optionCounts}
                        people={additionalPeople}
                        onPeopleChange={setAdditionalPeople}
                        errors={state?.apErrors}
                    />
                )}

                {!isLoggedIn && !previewMode && (
                    <Box sx={{ mt: 3 }}>
                        {gdprConsent && (
                            <input
                                type="hidden"
                                name="gdprConsent"
                                value="on"
                            />
                        )}
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={gdprConsent}
                                    onChange={(e) =>
                                        setGdprConsent(
                                            e.target.checked
                                        )
                                    }
                                />
                            }
                            label={
                                <>
                                    Souhlasím se{" "}
                                    <MuiLink
                                        component={NextLink}
                                        href="/gdpr"
                                        target="_blank"
                                    >
                                        zpracováním osobních údajů
                                    </MuiLink>
                                </>
                            }
                        />
                        {state?.errors?.gdprConsent && (
                            <FormHelperText error>
                                {state.errors.gdprConsent[0]}
                            </FormHelperText>
                        )}
                    </Box>
                )}

                <DecorativeDivider variant="ornate" my={3} />

                <Box
                    sx={{
                        textAlign: "center",
                        pb: { xs: 10, md: 0 },
                    }}
                >
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                    >
                        Po odeslání obdržíte potvrzení na email.
                    </Typography>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={
                            !previewMode &&
                            (isPending || !allRequiredFilled)
                        }
                        sx={{
                            px: 6,
                            py: 1.5,
                            fontSize: "1.1rem",
                            boxShadow:
                                "0 0 20px rgba(201, 162, 39, 0.3)",
                            "&:hover": {
                                boxShadow:
                                    "0 0 30px rgba(201, 162, 39, 0.5)",
                            },
                        }}
                    >
                        {!previewMode && isPending
                            ? "Odesílám..."
                            : previewMode
                              ? "Odeslat registraci (náhled)"
                              : "Odeslat registraci"}
                    </Button>
                    {state?.message && !state.success && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {state.message}
                        </Alert>
                    )}
                </Box>
            </Box>

            {previewMode && (
                        <Snackbar
                            open={previewSnackbar}
                            autoHideDuration={4000}
                            onClose={() =>
                                setPreviewSnackbar(false)
                            }
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "center",
                            }}
                        >
                            <Alert
                                severity="info"
                                onClose={() =>
                                    setPreviewSnackbar(false)
                                }
                            >
                                Toto je pouze náhled. Registrace
                                nebyla odeslána.
                            </Alert>
                        </Snackbar>
                    )}
                </Box>
            </Box>

            <Box
                sx={{
                    display: { xs: "none", md: "block" },
                    width: 320,
                    flexShrink: 0,
                }}
            >
                <Box sx={{ position: "sticky", top: 140 }}>
                    <PriceSummary {...priceSummaryProps} />
                    <Button
                        type="submit"
                        form="registration-form"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        disabled={
                            !previewMode &&
                            (isPending || !allRequiredFilled)
                        }
                        sx={{
                            mt: 2,
                            py: 1.5,
                            fontSize: "1rem",
                            boxShadow:
                                "0 0 20px rgba(201, 162, 39, 0.3)",
                            "&:hover": {
                                boxShadow:
                                    "0 0 30px rgba(201, 162, 39, 0.5)",
                            },
                        }}
                    >
                        {!previewMode && isPending
                            ? "Odesílám..."
                            : "Odeslat registraci"}
                    </Button>
                </Box>
            </Box>

            {hasPricing && (
                <StickyPriceSummary {...priceSummaryProps} />
            )}
        </Box>
    );
}
