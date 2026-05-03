import { Container, Typography, Chip, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";
import { getRegistrationFormForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields } from "@/lib/types/registration-form";
import { updateConditionalEmailTemplate } from "@/lib/actions/conditional-emails";

interface ConditionalEmailPageProps {
    params: Promise<{ id: string; emailId: string }>;
}

export default async function ConditionalEmailPage({ params }: ConditionalEmailPageProps) {
    const { id, emailId } = await params;

    const [conditionalEmail, emailAccounts] = await Promise.all([
        db.conditionalEmail.findUnique({
            where: { id: emailId },
            select: {
                id: true,
                yearId: true,
                name: true,
                conditionFieldName: true,
                conditionValue: true,
                subject: true,
                body: true,
                bcc: true,
                accountId: true,
            },
        }),
        db.emailAccount.findMany({
            select: { id: true, email: true, label: true, isMain: true },
            orderBy: [{ isMain: "desc" }, { email: "asc" }],
        }),
    ]);

    if (!conditionalEmail || conditionalEmail.yearId !== id) {
        notFound();
    }

    // Fetch year for breadcrumbs
    const year = await db.year.findUnique({
        where: { id },
        select: { id: true, year: true },
    });

    if (!year) {
        notFound();
    }

    // Build available placeholders from form fields
    const registrationForm = await getRegistrationFormForYear(year.id);
    const formData = registrationForm ? migrateFormData(registrationForm.fields) : null;
    const allFormInputFields = formData ? getAllInputFields(formData.fields) : [];

    const availablePlaceholders = [
        ...allFormInputFields.map((f) => ({ key: f.name, label: f.label })),
        { key: "variabilniSymbol", label: "Variabilní symbol" },
        { key: "celkovaCena", label: "Celková cena" },
        { key: "cisloUctu", label: "Číslo účtu" },
        { key: "rok", label: "Rok" },
        { key: "nazevRocniku", label: "Název ročníku" },
        { key: "qrPlatba", label: "QR platba" },
    ];

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Emaily", href: `/admin/rocniky/${year.id}/emaily` },
                    { label: conditionalEmail.name },
                ]}
                title={conditionalEmail.name}
            />

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                    Podmínka: pole <Chip label={conditionalEmail.conditionFieldName} size="small" sx={{ mx: 0.5 }} /> = <Chip label={conditionalEmail.conditionValue} size="small" sx={{ mx: 0.5 }} />
                </Typography>
            </Box>

            <EmailTemplateEditor
                yearId={conditionalEmail.id}
                confirmationEmailSubject={conditionalEmail.subject}
                confirmationEmailBody={conditionalEmail.body}
                confirmationEmailBcc={conditionalEmail.bcc}
                availablePlaceholders={availablePlaceholders}
                saveAction={updateConditionalEmailTemplate}
                emailAccounts={emailAccounts}
                selectedEmailAccountId={conditionalEmail.accountId}
            />
        </Container>
    );
}
