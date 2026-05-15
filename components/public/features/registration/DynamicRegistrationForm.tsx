"use client";

import {
    useState,
    useCallback,
    useMemo,
    useActionState,
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
import { alpha } from "@mui/material/styles";
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
import type { ContentBlock } from "@/lib/types/content-blocks";
import type { RegistrationStats } from "@/lib/services/registration";
import {
    isInputField,
    getAllFields,
    getAllInputFields,
    getAPInputFields,
    hasAdditionalPeopleFields,
} from "@/lib/types/registration-form";
import { getFieldRemainingInfo } from "@/lib/utils/quantity-remaining";
import { DynamicFormField } from "./DynamicFormField";
import { RegistrationSuccess } from "./RegistrationSuccess";
import { useConditionalFields } from "./useConditionalFields";
import { AdditionalPeopleSection } from "./AdditionalPeopleSection";
import { PriceSummary } from "./PriceSummary";
import { FormProgress } from "./FormProgress";
import { StickyPriceSummary } from "./StickyPriceSummary";
import { ValidationSummary } from "./ValidationSummary";
import {
    submitDynamicRegistration,
    type RegistrationState,
} from "@/lib/actions/public/registration";
import { useFormValidation } from "./useFormValidation";
import { useAutoSelect } from "./useAutoSelect";
import { usePreviewActions } from "./usePreviewActions";

interface DynamicRegistrationFormProps {
    formData: RegistrationFormData;
    optionCounts?: OptionCounts;
    previewMode?: boolean;
    previewYearId?: string;
    isLoggedIn?: boolean;
    publicEmail?: string;
    successContent?: ContentBlock[] | null;
    stats?: Record<string, RegistrationStats>;
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
    previewYearId,
    isLoggedIn,
    publicEmail,
    successContent,
    stats,
}: DynamicRegistrationFormProps) {
    const [values, setValues] = useState<SubmissionData>(() =>
        buildInitialValues(formData, publicEmail)
    );
    const [additionalPeople, setAdditionalPeople] = useState<
        AdditionalPersonData[]
    >([]);
    const { visibleFields } = useConditionalFields(formData, values);
    const [gdprConsent, setGdprConsent] = useState(false);

    const [state, formAction, isPending] = useActionState<
        RegistrationState | null,
        FormData
    >(submitDynamicRegistration, null);

    const [dismissedCapacityError, setDismissedCapacityError] =
        useState<string | null>(null);
    const capacitySnackbar = {
        open:
            !!state?.capacityError &&
            state.capacityError !== dismissedCapacityError,
        message: state?.capacityError ?? "",
    };

    // Derived field lists
    const allFields = getAllFields(formData.fields);
    const allInputFields = getAllInputFields(formData.fields);
    const showAPSection = hasAdditionalPeopleFields(formData.fields);
    const apFields = showAPSection
        ? getAPInputFields(formData.fields)
        : [];

    // Hooks
    const {
        canSubmit,
        validationSummary,
        getFieldError,
        markTouched,
        visibleAPFieldsPerPerson,
    } = useFormValidation({
        allInputFields,
        apFields,
        visibleFields,
        values,
        additionalPeople,
        formData,
        showAPSection,
        isLoggedIn,
        previewMode,
        gdprConsent,
        serverErrors: state?.errors,
    });

    useAutoSelect(
        formData,
        visibleFields,
        optionCounts,
        additionalPeople,
        setValues
    );

    const {
        previewSnackbar,
        closePreviewSnackbar,
        previewSending,
        handleSendPreviewEmail,
        successPreview,
        clearSuccessPreview,
        loadingSuccessPreview,
        handleShowSuccessPreview,
    } = usePreviewActions(previewYearId, values, additionalPeople);

    const handleChange = useCallback(
        (name: string, value: string | number | boolean) => {
            setValues((prev) => ({ ...prev, [name]: value }));
            markTouched(name);
        },
        [markTouched]
    );

    // Group fields into sections based on heading fields
    const sections = useMemo(() => {
        const result: {
            heading: FormField | null;
            fields: FormField[];
        }[] = [];
        let current: {
            heading: FormField | null;
            fields: FormField[];
        } = {
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

    // Early returns for success states
    if (previewMode && successPreview) {
        return (
            <Box>
                <Box sx={{ mb: 2, textAlign: "center" }}>
                    <Button
                        variant="outlined"
                        onClick={clearSuccessPreview}
                    >
                        Zpět na náhled formuláře
                    </Button>
                </Box>
                <RegistrationSuccess
                    message={successPreview.message}
                    variableSymbol={successPreview.variableSymbol}
                    totalPrice={
                        successPreview.totalPrice ?? undefined
                    }
                    paymentData={
                        successPreview.paymentData ?? undefined
                    }
                    successContent={successContent}
                />
            </Box>
        );
    }

    if (state?.success) {
        return (
            <RegistrationSuccess
                message={state.message}
                variableSymbol={state.variableSymbol}
                totalPrice={state.totalPrice}
                paymentData={state.paymentData}
                successContent={successContent}
                stats={stats}
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
                        action={formAction}
                    >
                        {previewMode && (
                            <input
                                type="hidden"
                                name="__test"
                                value="true"
                            />
                        )}
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
                            {sections.map(
                                (section, sectionIdx) => (
                                    <AnimatedSection
                                        key={
                                            section.heading?.id ??
                                            `section-${sectionIdx}`
                                        }
                                        delay={sectionIdx * 100}
                                    >
                                        {section.heading && (
                                            <DynamicFormField
                                                field={
                                                    section.heading
                                                }
                                                value=""
                                                onChange={
                                                    handleChange
                                                }
                                                pricingDefinitions={
                                                    formData.pricingDefinitions
                                                }
                                                priceTiers={
                                                    formData.priceTiers
                                                }
                                            />
                                        )}
                                        {section.fields.length >
                                            0 && (
                                            <Paper
                                                variant="outlined"
                                                sx={{
                                                    display: "flex",
                                                    flexDirection:
                                                        "column",
                                                    gap: 2.5,
                                                    p: {
                                                        xs: 2,
                                                        md: 3,
                                                    },
                                                    borderRadius: 2,
                                                }}
                                            >
                                                {section.fields.map(
                                                    (field) => {
                                                        const value =
                                                            isInputField(
                                                                field
                                                            )
                                                                ? (values[
                                                                      field
                                                                          .name
                                                                  ] ??
                                                                  "")
                                                                : "";
                                                        const remainingInfo =
                                                            isInputField(
                                                                field
                                                            )
                                                                ? getFieldRemainingInfo(
                                                                      field,
                                                                      formData.pricingDefinitions,
                                                                      formData.capacityLimits,
                                                                      optionCounts,
                                                                      additionalPeople
                                                                  )
                                                                : undefined;

                                                        return (
                                                            <Fade
                                                                key={
                                                                    field.id
                                                                }
                                                                in
                                                                timeout={
                                                                    300
                                                                }
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
                                                                            remainingInfo?.disabled
                                                                        }
                                                                        remainingCapacity={
                                                                            remainingInfo?.remaining
                                                                        }
                                                                        readOnlyEmail={
                                                                            isLoggedIn &&
                                                                            isInputField(
                                                                                field
                                                                            ) &&
                                                                            field.type ===
                                                                                "email" &&
                                                                            !!publicEmail
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
                                )
                            )}
                        </Box>

                        {showAPSection && (
                            <AdditionalPeopleSection
                                formData={formData}
                                apFields={apFields}
                                mainValues={values}
                                optionCounts={optionCounts}
                                people={additionalPeople}
                                onPeopleChange={
                                    setAdditionalPeople
                                }
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
                                                zpracováním osobních
                                                údajů
                                            </MuiLink>
                                        </>
                                    }
                                />
                                {state?.errors?.gdprConsent && (
                                    <FormHelperText error>
                                        {
                                            state.errors
                                                .gdprConsent[0]
                                        }
                                    </FormHelperText>
                                )}
                            </Box>
                        )}

                        <DecorativeDivider
                            variant="ornate"
                            sx={{ my: 3 }}
                        />

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
                                Po odeslání obdržíte potvrzení na
                                email.
                            </Typography>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                size="large"
                                disabled={
                                    isPending || !canSubmit
                                }
                                sx={{
                                    px: 6,
                                    py: 1.5,
                                    fontSize: "1.1rem",
                                    boxShadow: (theme) =>
                                        `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                                    "&:hover": {
                                        boxShadow: (theme) =>
                                            `0 0 30px ${alpha(theme.palette.primary.main, 0.5)}`,
                                    },
                                }}
                            >
                                {isPending
                                    ? "Odesílám..."
                                    : previewMode
                                      ? "Odeslat registraci (test - bez emailu)"
                                      : "Odeslat registraci"}
                            </Button>
                            {previewMode && previewYearId && (
                                <Box
                                    sx={{
                                        mt: 2,
                                        display: "flex",
                                        gap: 1,
                                        justifyContent: "center",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="primary"
                                        size="large"
                                        onClick={
                                            handleSendPreviewEmail
                                        }
                                        disabled={
                                            previewSending ||
                                            !canSubmit
                                        }
                                        sx={{ px: 4, py: 1.25 }}
                                    >
                                        {previewSending
                                            ? "Odesílám..."
                                            : "Odeslat potvrzovací email (test)"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outlined"
                                        color="primary"
                                        size="large"
                                        onClick={
                                            handleShowSuccessPreview
                                        }
                                        disabled={
                                            loadingSuccessPreview
                                        }
                                        sx={{ px: 4, py: 1.25 }}
                                    >
                                        {loadingSuccessPreview
                                            ? "Načítám..."
                                            : "Náhled potvrzovací stránky"}
                                    </Button>
                                </Box>
                            )}
                            {!isPending && (
                                <ValidationSummary
                                    summary={validationSummary}
                                />
                            )}
                            {state?.message &&
                                !state.success && (
                                    <Alert
                                        severity="error"
                                        sx={{ mt: 2 }}
                                    >
                                        {state.message}
                                    </Alert>
                                )}
                        </Box>
                    </Box>

                    {previewMode && (
                        <Snackbar
                            open={previewSnackbar.open}
                            autoHideDuration={4000}
                            onClose={closePreviewSnackbar}
                            anchorOrigin={{
                                vertical: "bottom",
                                horizontal: "center",
                            }}
                        >
                            <Alert
                                severity={
                                    previewSnackbar.severity
                                }
                                onClose={closePreviewSnackbar}
                            >
                                {previewSnackbar.message}
                            </Alert>
                        </Snackbar>
                    )}

                    <Snackbar
                        open={capacitySnackbar.open}
                        autoHideDuration={6000}
                        onClose={() =>
                            setDismissedCapacityError(
                                state?.capacityError ?? null
                            )
                        }
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "center",
                        }}
                    >
                        <Alert
                            severity="error"
                            variant="filled"
                            onClose={() =>
                                setDismissedCapacityError(
                                    state?.capacityError ?? null
                                )
                            }
                        >
                            {capacitySnackbar.message}
                        </Alert>
                    </Snackbar>
                </Box>
            </Box>

            <Box
                sx={{
                    display: { xs: "none", md: "block" },
                    width: 320,
                    flexShrink: 0,
                }}
            >
                <Box
                    sx={{
                        position: "sticky",
                        top: 140,
                        maxHeight: "calc(100vh - 156px)",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
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
                            (isPending || !canSubmit)
                        }
                        sx={{
                            mt: 2,
                            py: 1.5,
                            fontSize: "1rem",
                            boxShadow: (theme) =>
                                `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                            "&:hover": {
                                boxShadow: (theme) =>
                                    `0 0 30px ${alpha(theme.palette.primary.main, 0.5)}`,
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
