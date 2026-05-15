"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tab,
    Tabs,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    type FormElement,
    type AdditionalPersonData,
    getAllFields,
} from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatDate } from "@/lib/utils/date";
import { GameIcon } from "@/lib/icons";
import {
    useConditionalFields,
    evaluateAPVisibleFields,
} from "@/components/public/features/registration/useConditionalFields";
import { updatePublicRegistration } from "@/lib/actions/public/registration-edit";
import { type SerializedRegistration } from "./registration-detail.types";
import { isFieldEditable } from "./registration-detail.utils";
import { EditableFieldList } from "./editable-field-list";

export function RegistrationEditDialog({
    registration,
    open,
    onClose,
}: {
    registration: SerializedRegistration;
    open: boolean;
    onClose: () => void;
}) {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
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
            fullScreen={fullScreen}
            PaperProps={{
                variant: fullScreen ? undefined : "outlined",
                elevation: 0,
                sx: {
                    ...(!fullScreen && {
                        borderRadius: 2,
                        height: "calc(100% - 64px)",
                        maxHeight: "calc(100% - 64px)",
                    }),
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

                {editTab === 0 ? (
                    <EditableFieldList
                        fields={allFields}
                        data={editedData}
                        formData={formData}
                        errors={errors}
                        onChange={handlePrimaryChange}
                        visibleFields={mainVisibleFields}
                    />
                ) : (
                    <EditableFieldList
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
