import { Container, Box, Typography, Card, CardContent } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { MarkEmailRead } from "@mui/icons-material";
import { EmailToggle } from "./email-toggle";

interface EmailyPageProps {
    params: Promise<{ id: string }>;
}

async function getYearEmailStatus(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            confirmationEmailEnabled: true,
            confirmationEmailSubject: true,
            confirmationEmailBody: true,
        },
    });
}

export default async function EmailyPage({ params }: EmailyPageProps) {
    const { id } = await params;
    const year = await getYearEmailStatus(id);

    if (!year) {
        notFound();
    }

    const hasTemplate = !!year.confirmationEmailSubject && !!year.confirmationEmailBody;

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Emaily" },
                ]}
                title="Emaily"
            />

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Potvrzovací email
                    </Typography>

                    <EmailToggle
                        yearId={year.id}
                        initialEnabled={year.confirmationEmailEnabled}
                        hasTemplate={hasTemplate}
                    />

                    {!hasTemplate && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                            Šablona emailu zatím není nastavena.
                        </Typography>
                    )}

                    <Box sx={{ mt: 2 }}>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/emaily/potvrzovaci`}
                            variant="outlined"
                            startIcon={<MarkEmailRead />}
                        >
                            {hasTemplate ? "Zobrazit šablonu" : "Nastavit šablonu"}
                        </LinkButton>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}
