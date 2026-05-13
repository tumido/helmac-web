import { Container, Box, Divider, Typography, Card, CardContent } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { MarkEmailRead, Payment, PriceChange } from "@mui/icons-material";
import { EmailToggle } from "./email-toggle";
import { togglePriceChangeEmail } from "@/lib/actions/years";
import { togglePaymentEmail } from "@/lib/actions/bank-sync";
import { ConditionalEmailCard } from "./conditional-email-card";
import { CreateConditionalEmailDialog } from "./create-conditional-email-dialog";
import { getRegistrationFormForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields } from "@/lib/types/registration-form";
import { getFieldOptionValues } from "@/lib/utils/pricing";

interface EmailyPageProps {
    params: Promise<{ id: string }>;
}

const OPTION_FIELD_TYPES = new Set([
    "select",
    "radio",
    "checkbox",
    "pricing_select",
    "pricing_multi_select",
]);

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
            paymentEmailEnabled: true,
            paymentEmailSubject: true,
            paymentEmailBody: true,
            paymentEmailAccountId: true,
            paymentEmailAccount: {
                select: { email: true, label: true },
            },
            conditionalEmails: {
                select: {
                    id: true,
                    name: true,
                    enabled: true,
                    conditionFieldName: true,
                    conditionOperator: true,
                    conditionValue: true,
                    subject: true,
                    body: true,
                    account: {
                        select: { email: true, label: true },
                    },
                },
                orderBy: { createdAt: "asc" },
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
    const hasPaymentTemplate = !!year.paymentEmailSubject && !!year.paymentEmailBody;

    // Build available fields for conditional email creation
    const registrationForm = await getRegistrationFormForYear(year.id);
    const formData = registrationForm ? migrateFormData(registrationForm.fields) : null;
    const allInputFields = formData ? getAllInputFields(formData.fields) : [];
    const pricingDefinitions = formData?.pricingDefinitions ?? [];
    const fieldNameToLabel = new Map(allInputFields.map((f) => [f.name, f.label]));
    const availableFields = allInputFields
        .filter((f) => {
            if (!OPTION_FIELD_TYPES.has(f.type)) return false;
            if (f.type === "checkbox") return true;
            return getFieldOptionValues(f, pricingDefinitions).length > 0;
        })
        .map((f) => ({
            id: f.id,
            name: f.name,
            label: f.label,
            type: f.type,
            options: getFieldOptionValues(f, pricingDefinitions),
        }));

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

            <Card variant="outlined" sx={{ mb: 3 }}>
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

            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Email při přijetí platby
                    </Typography>

                    <EmailToggle
                        yearId={year.id}
                        initialEnabled={year.paymentEmailEnabled}
                        hasTemplate={hasPaymentTemplate}
                        toggleAction={togglePaymentEmail}
                        label="Odesílat email po přijetí platby"
                    />

                    {!hasPaymentTemplate && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                            Šablona emailu zatím není nastavena.
                        </Typography>
                    )}

                    {hasPaymentTemplate && (
                        <SenderInfo account={year.paymentEmailAccount} />
                    )}

                    <Box sx={{ mt: 2 }}>
                        <LinkButton
                            href={`/admin/rocniky/${year.id}/emaily/platba`}
                            variant="outlined"
                            startIcon={<Payment />}
                        >
                            {hasPaymentTemplate ? "Zobrazit šablonu" : "Nastavit šablonu"}
                        </LinkButton>
                    </Box>
                </CardContent>
            </Card>

            {year.conditionalEmails.length > 0 && (
                <>
                    <Divider sx={{ my: 4 }} />
                    <Typography variant="h6" sx={{ mb: 3 }}>
                        Podmíněné emaily
                    </Typography>
                    {year.conditionalEmails.map((email) => (
                        <ConditionalEmailCard
                            key={email.id}
                            yearId={year.id}
                            email={{
                                ...email,
                                conditionFieldLabel:
                                    fieldNameToLabel.get(email.conditionFieldName) ?? email.conditionFieldName,
                            }}
                        />
                    ))}
                </>
            )}

            <CreateConditionalEmailDialog
                yearId={year.id}
                availableFields={availableFields}
            />
        </Container>
    );
}
