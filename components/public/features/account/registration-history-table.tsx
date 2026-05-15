"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Chip,
    Collapse,
    Divider,
    IconButton,
    Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import {
    type FormElement,
    type AdditionalPersonData,
    getAllFields,
} from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatPrice } from "@/lib/utils/pricing";
import { computePricingLineItems } from "@/lib/utils/pricing-line-items";
import { formatDate } from "@/lib/utils/date";
import { GameIcon } from "@/lib/icons";
import {
    type SerializedRegistration,
    type RegistrationHistoryTableProps,
} from "./registration-detail.types";
import { isFieldEditable } from "./registration-detail.utils";
import { PriceBreakdown } from "./price-breakdown";
import { InlinePayment } from "./inline-payment";
import { RegistrationViewDialog } from "./registration-view-dialog";
import { RegistrationEditDialog } from "./registration-edit-dialog";

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
                        (reg.year.registrationOpen || reg.isTest) &&
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
                                        {reg.isTest && (
                                            <Chip
                                                label="TEST"
                                                color="warning"
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 700 }}
                                            />
                                        )}
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
