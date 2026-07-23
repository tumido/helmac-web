import {
    Container,
    Typography,
    Grid,
    Paper,
    Box,
    IconButton,
    Chip,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { SubmissionActions } from "@/components/admin/submission-actions";
import { SubmissionEditForm } from "@/components/forms/submission-edit-form";
import { SubmissionPricingSummary } from "@/components/admin/submission-pricing-summary";
import { ResendEmailButton } from "@/components/admin/resend-email-button";
import { AdminNoteDetail } from "@/components/admin/admin-note-detail";
import { getOrderByLegacyId } from "@/lib/services/v2";
import type { RegistrationStatus } from "@prisma/client";
import type { PricingSummaryData } from "@/lib/types/registration-form";
import { formatDateTime } from "@/lib/utils/date";

interface SubmissionDetailPageProps {
    params: Promise<{
        id: string;
        submissionId: string;
    }>;
}

export default async function SubmissionDetailPage({
    params,
}: SubmissionDetailPageProps) {
    const session = await requireEditor();
    const isEditor = session.user?.role === "EDITOR";
    const { id: yearId, submissionId } = await params;
    const order = await getOrderByLegacyId(submissionId);

    if (!order || order.yearId !== yearId) {
        notFound();
    }

    if (isEditor && !order.isTest) {
        notFound();
    }

    const fields = (() => {
        const byName = new Map(
            order.allFields.map((f) => [
                f.name,
                { ...f, includeForAP: f.includeForAdditionalPeople },
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
    })();

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    {
                        label: "Ročníky",
                        href: "/admin/rocniky",
                    },
                    {
                        label: `${order.yearNumber} - ${order.yearTitle}`,
                        href: `/admin/rocniky/${yearId}`,
                    },
                    {
                        label: "Registrace",
                        href: `/admin/rocniky/${yearId}/registrace`,
                    },
                    {
                        label: "Přihlášky",
                        href: `/admin/rocniky/${yearId}/registrace/prihlasky`,
                    },
                    { label: "Detail registrace" },
                ]}
                title="Detail registrace"
            />
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 3,
                    gap: 1,
                }}
            >
                <NextLink
                    href={`/admin/rocniky/${yearId}/registrace/prihlasky`}
                    passHref
                    legacyBehavior
                >
                    <IconButton size="small" sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                </NextLink>
                {order.isTest && (
                    <Chip
                        label="TEST"
                        color="warning"
                        size="small"
                        variant="outlined"
                        sx={{ fontWeight: 700 }}
                    />
                )}
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    Vytvořeno:{" "}
                    {formatDateTime(order.createdAt)}
                    {order.paidAt &&
                        ` • Zaplaceno: ${formatDateTime(order.paidAt)}`}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography
                            variant="h6"
                            sx={{ mb: 2 }}
                        >
                            Data registrace
                        </Typography>
                        <SubmissionEditForm
                            legacySubmissionId={
                                submissionId
                            }
                            fields={fields}
                            pricingDefinitions={
                                order.pricingDefinitions
                            }
                            people={order.people}
                            readOnly={isEditor}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography
                            variant="h6"
                            sx={{ mb: 2 }}
                        >
                            Platba
                        </Typography>
                        <SubmissionPricingSummary
                            pricingSummary={
                                order.pricingSummary as PricingSummaryData | null
                            }
                            variableSymbol={
                                order.variableSymbol
                            }
                            totalPrice={order.totalPrice}
                        />
                    </Paper>
                    {!isEditor && (
                        <>
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2 }}
                                >
                                    Potvrzovací email
                                </Typography>
                                <ResendEmailButton
                                    submissionId={
                                        submissionId
                                    }
                                    emailSent={
                                        order.emailSent
                                    }
                                    emailSentAt={
                                        order.emailSentAt
                                    }
                                />
                            </Paper>
                            <Paper sx={{ p: 3, mb: 3 }}>
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2 }}
                                >
                                    Poznámka admina
                                </Typography>
                                <AdminNoteDetail
                                    submissionId={
                                        submissionId
                                    }
                                    adminNote={
                                        order.adminNote
                                    }
                                />
                            </Paper>
                            <Paper sx={{ p: 3 }}>
                                <Typography
                                    variant="h6"
                                    sx={{ mb: 2 }}
                                >
                                    Správa
                                </Typography>
                                <SubmissionActions
                                    submissionId={
                                        submissionId
                                    }
                                    yearId={yearId}
                                    status={order.status as RegistrationStatus}
                                    isPaid={order.isPaid}
                                />
                            </Paper>
                        </>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
}
