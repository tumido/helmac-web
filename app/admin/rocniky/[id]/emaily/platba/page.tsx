import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { EmailTemplateEditor } from "@/components/admin/email-template-editor";
import { updatePaymentEmailTemplate } from "@/lib/actions/bank-sync";
import {
    getFormStructure,
    v2FieldsToFormFields,
    v2PricingDefsToPricingDefs,
} from "@/lib/services/v2";
import type { EmailConditionalSection } from "@/lib/types/email-sections";
import type { EmailAttachment } from "@/lib/validators/email-attachment";

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
            paymentEmailSections: true,
            paymentEmailAttachments: true,
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

    const formStructure = await getFormStructure(year.id);
    const allFormFields = formStructure
        ? v2FieldsToFormFields(formStructure.fields)
        : [];
    const pricingDefinitions = formStructure
        ? v2PricingDefsToPricingDefs(formStructure.pricingDefinitions)
        : [];

    const availablePlaceholders = [
        ...(formStructure?.fields ?? []).map((f) => ({ key: f.name, label: f.label })),
        { key: "variabilniSymbol", label: "Variabilní symbol" },
        { key: "celkovaCena", label: "Celková cena" },
        { key: "prijataCastka", label: "Přijatá částka" },
        { key: "cisloUctu", label: "Číslo účtu" },
        { key: "iban", label: "IBAN" },
        { key: "swift", label: "SWIFT" },
        { key: "rok", label: "Rok" },
        { key: "nazevRocniku", label: "Název ročníku" },
        { key: "podtitulek", label: "Podtitulek" },
    ];

    return (
        <Container maxWidth="xl">
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
                initialSections={(year.paymentEmailSections as unknown as EmailConditionalSection[]) ?? []}
                initialAttachments={(year.paymentEmailAttachments as unknown as EmailAttachment[]) ?? []}
                availableFields={allFormFields}
                pricingDefinitions={pricingDefinitions}
            />
        </Container>
    );
}
