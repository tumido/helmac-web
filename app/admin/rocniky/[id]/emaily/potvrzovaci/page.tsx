import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";
import { getRegistrationFormForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields, getAllFields } from "@/lib/types/registration-form";
import type { EmailConditionalSection } from "@/lib/types/email-sections";

interface PotvrzovacíPageProps {
    params: Promise<{ id: string }>;
}

async function getYearEmailTemplate(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            confirmationEmailSubject: true,
            confirmationEmailBody: true,
            confirmationEmailBcc: true,
            confirmationEmailAccountId: true,
            confirmationEmailSections: true,
        },
    });
}

export default async function PotvrzovacíPage({ params }: PotvrzovacíPageProps) {
    const { id } = await params;
    const [year, emailAccounts] = await Promise.all([
        getYearEmailTemplate(id),
        db.emailAccount.findMany({
            select: { id: true, email: true, label: true, isMain: true },
            orderBy: [{ isMain: "desc" }, { email: "asc" }],
        }),
    ]);

    if (!year) {
        notFound();
    }

    // Build available placeholders from form fields
    const registrationForm = await getRegistrationFormForYear(year.id);
    const formData = registrationForm ? migrateFormData(registrationForm.fields) : null;
    const allFormInputFields = formData ? getAllInputFields(formData.fields) : [];
    const allFormFields = formData ? getAllFields(formData.fields) : [];
    const pricingDefinitions = formData?.pricingDefinitions ?? [];

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
        <Container maxWidth="xl">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Emaily", href: `/admin/rocniky/${year.id}/emaily` },
                    { label: "Potvrzovací" },
                ]}
                title="Potvrzovací email"
            />

            <EmailTemplateEditor
                yearId={year.id}
                confirmationEmailSubject={year.confirmationEmailSubject}
                confirmationEmailBody={year.confirmationEmailBody}
                confirmationEmailBcc={year.confirmationEmailBcc}
                availablePlaceholders={availablePlaceholders}
                emailAccounts={emailAccounts}
                selectedEmailAccountId={year.confirmationEmailAccountId}
                initialSections={(year.confirmationEmailSections as unknown as EmailConditionalSection[]) ?? []}
                availableFields={allFormFields}
                pricingDefinitions={pricingDefinitions}
            />
        </Container>
    );
}
