import { Container, Box, Typography, Card, CardContent } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { MarkEmailRead, PriceChange } from "@mui/icons-material";
import { EmailToggle } from "./email-toggle";
import { togglePriceChangeEmail } from "@/lib/actions/years";

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
            confirmationEmailAccountId: true,
            confirmationEmailAccount: {
                select: { email: true, label: true },
            },
            priceChangeEmailEnabled: true,
            priceChangeEmailSubject: true,
            priceChangeEmailBody: true,
            priceChangeEmailAccountId: true,
            priceChangeEmailAccount: {
                select: { email: true, label: true },
            },
        },
    });
}

function SenderInfo({ account }: { account: { email: string; label: string | null } | null }) {
    if (account) {
        return (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Odesílatel: {account.email}{account.label ? ` (${account.label})` : ""}
            </Typography>
        );
    }
    return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Odesílatel: Hlavní emailový účet
        </Typography>
    );
}

export default async function EmailyPage({ params }: EmailyPageProps) {
    const { id } = await params;
    const year = await getYearEmailStatus(id);

    if (!year) {
        notFound();
    }

    const hasConfirmationTemplate = !!year.confirmationEmailSubject && !!year.confirmationEmailBody;
    const hasPriceChangeTemplate = !!year.priceChangeEmailSubject && !!year.priceChangeEmailBody;

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

            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Potvrzovací email
                    </Typography>

                    <EmailToggle
                        yearId={year.id}
                        initialEnabled={year.confirmationEmailEnabled}
                        hasTemplate={hasConfirmationTemplate}
                    />

                    {!hasConfirmationTemplate && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                            Šablona emailu zatím není nastavena.
                        </Typography>
                    )}

                    {hasConfirmationTemplate && (
                        <SenderInfo account={year.confirmationEmailAccount} />
                    )}

                    <Box sx={{ mt: 2 }}>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/emaily/potvrzovaci`}
                            variant="outlined"
                            startIcon={<MarkEmailRead />}
                        >
                            {hasConfirmationTemplate ? "Zobrazit šablonu" : "Nastavit šablonu"}
                        </LinkButton>
                    </Box>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Email při změně ceny
                    </Typography>

                    <EmailToggle
                        yearId={year.id}
                        initialEnabled={year.priceChangeEmailEnabled}
                        hasTemplate={hasPriceChangeTemplate}
                        toggleAction={togglePriceChangeEmail}
                        label="Odesílat email při změně ceny registrace"
                    />

                    {!hasPriceChangeTemplate && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                            Šablona emailu zatím není nastavena.
                        </Typography>
                    )}

                    {hasPriceChangeTemplate && (
                        <SenderInfo account={year.priceChangeEmailAccount} />
                    )}

                    <Box sx={{ mt: 2 }}>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/emaily/zmena-ceny`}
                            variant="outlined"
                            startIcon={<PriceChange />}
                        >
                            {hasPriceChangeTemplate ? "Zobrazit šablonu" : "Nastavit šablonu"}
                        </LinkButton>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}
