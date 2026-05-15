"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tab,
    Table,
    TableBody,
    Tabs,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    type FormElement,
    type AdditionalPersonData,
    getAllFields,
    isInputField,
} from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatDate } from "@/lib/utils/date";
import { GameIcon } from "@/lib/icons";
import { resolveSubmissionDataForDisplay } from "@/lib/utils/pricing-display";
import { type SerializedRegistration } from "./registration-detail.types";
import { FieldTableRows } from "./field-table-rows";

export function RegistrationViewDialog({
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
