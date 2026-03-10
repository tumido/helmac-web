import { Container, Typography, Grid, Paper } from "@mui/material";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { SubmissionActions } from "@/components/admin/submission-actions";
import { SubmissionEditForm } from "@/components/forms/submission-edit-form";
import { SubmissionPricingSummary } from "@/components/admin/submission-pricing-summary";
import { getSubmissionById } from "@/lib/services/registration";
import { getAllFields, getAPInputFields } from "@/lib/types/registration-form";
import type { PricingSummaryData } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";

interface SubmissionDetailPageProps {
    params: Promise<{ id: string; submissionId: string }>;
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
    const { id: yearId, submissionId } = await params;
    const submission = await getSubmissionById(submissionId);

    if (!submission || submission.yearId !== yearId) {
        notFound();
    }

    const formData = migrateFormData(submission.form.fields);
    const fields = getAllFields(formData.fields);
    const data = submission.data as Record<string, unknown>;
    const pricingDefinitions = formData.pricingDefinitions;
    const apFields = getAPInputFields(formData.fields);

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${submission.year.year} - ${submission.year.title}`, href: `/admin/rocniky/${yearId}` },
                    { label: "Registrace", href: `/admin/rocniky/${yearId}/registrace` },
                    { label: `Detail registrace` },
                ]}
                title="Detail registrace"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Vytvořeno: {new Date(submission.createdAt).toLocaleString("cs-CZ")}
                {submission.paidAt && ` • Zaplaceno: ${new Date(submission.paidAt).toLocaleString("cs-CZ")}`}
            </Typography>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Data registrace
                        </Typography>
                        <SubmissionEditForm
                            submissionId={submissionId}
                            fields={fields}
                            data={data}
                            pricingDefinitions={pricingDefinitions}
                            apFields={apFields}
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Platba
                        </Typography>
                        <SubmissionPricingSummary
                            pricingSummary={submission.pricingSummary as PricingSummaryData | null}
                            variableSymbol={submission.variableSymbol}
                            totalPrice={submission.totalPrice}
                        />
                    </Paper>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Správa
                        </Typography>
                        <SubmissionActions
                            submissionId={submissionId}
                            yearId={yearId}
                            status={submission.status}
                            isPaid={submission.isPaid}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
