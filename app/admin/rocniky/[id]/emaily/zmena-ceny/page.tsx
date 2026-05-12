import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";
import { updatePriceChangeEmailTemplate } from "@/lib/actions/years";
import { getRegistrationFormForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields, getAllFields } from "@/lib/types/registration-form";
import type { EmailConditionalSection } from "@/lib/types/email-sections";

interface ZmenaCenyPageProps {
    params: Promise<{ id: string }>;
}

async function getYearPriceChangeEmailTemplate(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            priceChangeEmailSubject: true,
            priceChangeEmailBody: true,
            priceChangeEmailBcc: true,
            priceChangeEmailAccountId: true,
            priceChangeEmailSections: true,
        },
    });
}

export default async function ZmenaCenyPage({ params }: ZmenaCenyPageProps) {
    const { id } = await params;
    const [year, emailAccounts] = await Promise.all([
        getYearPriceChangeEmailTemplate(id),
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
        { key: "celkovaCena", label: "Celková cena (nová)" },
        { key: "staraCena", label: "Původní cena" },
        { key: "novaCena", label: "Nová cena" },
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
                    { label: "Změna ceny" },
                ]}
                title="Email při změně ceny"
            />

            <EmailTemplateEditor
                yearId={year.id}
                confirmationEmailSubject={year.priceChangeEmailSubject}
                confirmationEmailBody={year.priceChangeEmailBody}
                confirmationEmailBcc={year.priceChangeEmailBcc}
                availablePlaceholders={availablePlaceholders}
                saveAction={updatePriceChangeEmailTemplate}
                emailAccounts={emailAccounts}
                selectedEmailAccountId={year.priceChangeEmailAccountId}
                initialSections={(year.priceChangeEmailSections as unknown as EmailConditionalSection[]) ?? []}
                availableFields={allFormFields}
                pricingDefinitions={pricingDefinitions}
            />
        </Container>
    );
}
