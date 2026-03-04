import { Container, Typography, Grid, Paper } from "@mui/material";
import { notFound } from "next/navigation";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { SubmissionActions } from "@/components/admin/submission-actions";
import { SubmissionEditForm } from "@/components/forms/submission-edit-form";
import { getSubmissionById } from "@/lib/services/registration";
import type { FormField } from "@/lib/types/registration-form";

interface SubmissionDetailPageProps {
    params: Promise<{ id: string; submissionId: string }>;
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
    const { id: yearId, submissionId } = await params;
    const submission = await getSubmissionById(submissionId);

    if (!submission || submission.yearId !== yearId) {
        notFound();
    }

    const fields = submission.form.fields as unknown as FormField[];
    const data = submission.data as Record<string, unknown>;

    return (
        <Container maxWidth="lg">
            <AdminBreadcrumbs
                items={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${submission.year.year} - ${submission.year.title}`, href: `/admin/rocniky/${yearId}` },
                    { label: "Registrace", href: `/admin/rocniky/${yearId}/registrace` },
                    { label: `Detail registrace` },
                ]}
            />

            <Typography variant="h4" sx={{ mb: 1 }}>
                Detail registrace
            </Typography>
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
                        />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
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
