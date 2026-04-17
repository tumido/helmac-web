import { Container, Box, Divider } from "@mui/material";
import { Description, People } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { RegistrationSettings } from "@/components/admin/registration-settings";
import { CapacityLimitsEditor } from "@/components/admin/capacity-limits-editor";
import { OptionCountsEditor } from "@/components/admin/option-counts-editor";
import { LinkButton } from "@/components/ui/link-button";
import { getRegistrationFormForYear, getOptionCountsForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields } from "@/lib/types/registration-form";

interface RegistracePageProps {
    params: Promise<{ id: string }>;
}

async function getYearRegistration(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            registrationOpen: true,
            registrationStartDate: true,
            _count: {
                select: { registrationSubmissions: true },
            },
        },
    });
}

export default async function RegistracePage({ params }: RegistracePageProps) {
    await requireAdmin();
    const { id } = await params;
    const year = await getYearRegistration(id);

    if (!year) {
        notFound();
    }

    // Count total registered people (main registrants + additional people)
    const submissions = await db.registrationSubmission.findMany({
        where: { yearId: year.id, status: { notIn: ["CANCELLED", "REJECTED"] } },
        select: { data: true },
    });
    const totalPeopleCount = submissions.reduce((sum, sub) => {
        const data = sub.data as Record<string, unknown>;
        const ap = Array.isArray(data.additionalPeople) ? data.additionalPeople.length : 0;
        return sum + 1 + ap;
    }, 0);

    // Fetch form data for capacity limits editor
    const registrationForm = await getRegistrationFormForYear(year.id);
    const formData = registrationForm ? migrateFormData(registrationForm.fields) : null;

    // Fields with options for capacity limits
    const allInputFields = formData
        ? getAllInputFields(formData.fields).filter(
            (f) => f.type === "select" || f.type === "radio" || f.type === "pricing_select" || f.type === "pricing_multi_select"
        )
        : [];

    // Compute option counts if there are any option fields
    const optionCounts = formData && allInputFields.length > 0
        ? await getOptionCountsForYear(year.id)
        : undefined;

    // Check registration open constraints
    const mainEmail = await db.emailAccount.findFirst({ where: { isMain: true } });
    const bankAccount = await db.bankAccount.findFirst({
        where: { bankAccountNumber: { not: null } },
    });

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Registrace" },
                ]}
                title="Registrace"
            />

            <RegistrationSettings
                yearId={year.id}
                registrationOpen={year.registrationOpen}
                registrationStartDate={year.registrationStartDate}
                submissionCount={year._count.registrationSubmissions}
                totalPeopleCount={totalPeopleCount}
                hasMainEmail={!!mainEmail}
                hasBankAccount={!!bankAccount}
            />

            {formData && allInputFields.length > 0 && (
                <>
                    <Divider sx={{ my: 3 }} />
                    <CapacityLimitsEditor
                        yearId={year.id}
                        capacityLimits={formData.capacityLimits}
                        allInputFields={allInputFields}
                        pricingDefinitions={formData.pricingDefinitions}
                        optionCounts={optionCounts}
                    />
                    <Divider sx={{ my: 3 }} />
                    <OptionCountsEditor
                        yearId={year.id}
                        showOptionCounts={formData.showOptionCounts}
                        allInputFields={allInputFields}
                        optionCounts={optionCounts}
                    />
                </>
            )}

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/registrace/formular`}
                    variant="outlined"
                    startIcon={<Description />}
                >
                    Upravit formulář
                </LinkButton>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/registrace/prihlasky`}
                    variant="outlined"
                    startIcon={<People />}
                >
                    Zobrazit přihlášky
                </LinkButton>
            </Box>
        </Container>
    );
}
