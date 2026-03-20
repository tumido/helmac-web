import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";
import { updatePaymentEmailTemplate } from "@/lib/actions/bank-sync";
import { getRegistrationFormForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields } from "@/lib/types/registration-form";

interface PlatbaPageProps {
    params: Promise<{ id: string }>;
}

async function getYearPaymentEmailTemplate(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            paymentEmailSubject: true,
            paymentEmailBody: true,
            paymentEmailBcc: true,
            paymentEmailAccountId: true,
        },
    });
}

export default async function PlatbaPage({ params }: PlatbaPageProps) {
    const { id } = await params;
    const [year, emailAccounts] = await Promise.all([
        getYearPaymentEmailTemplate(id),
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

    const availablePlaceholders = [
        ...allFormInputFields.map((f) => ({ key: f.name, label: f.label })),
        { key: "variabilniSymbol", label: "Variabilní symbol" },
        { key: "celkovaCena", label: "Celková cena" },
        { key: "prijataCastka", label: "Přijatá částka" },
        { key: "cisloUctu", label: "Číslo účtu" },
        { key: "rok", label: "Rok" },
        { key: "nazevRocniku", label: "Název ročníku" },
    ];

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Emaily", href: `/admin/rocniky/${year.id}/emaily` },
                    { label: "Platba" },
                ]}
                title="Email při přijetí platby"
            />

            <EmailTemplateEditor
                yearId={year.id}
                confirmationEmailSubject={year.paymentEmailSubject}
                confirmationEmailBody={year.paymentEmailBody}
                confirmationEmailBcc={year.paymentEmailBcc}
                availablePlaceholders={availablePlaceholders}
                saveAction={updatePaymentEmailTemplate}
                emailAccounts={emailAccounts}
                selectedEmailAccountId={year.paymentEmailAccountId}
            />
        </Container>
    );
}
