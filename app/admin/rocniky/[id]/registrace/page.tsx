import { Container, Box, Divider } from "@mui/material";
import {
    Description,
    People,
    CheckCircleOutline,
} from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { RegistrationSettings } from "@/components/admin/registration-settings";
import { CapacityLimitsEditor } from "@/components/admin/capacity-limits-editor";
import { OptionCountsEditor } from "@/components/admin/option-counts-editor";
import { LinkButton } from "@/components/ui/link-button";
import { getOptionCountsForYear } from "@/lib/services";
import {
    getRegistrationSummary,
    getFormStructure,
    v2FieldToInputField,
    v2PricingDefsToPricingDefs,
    countOrders,
} from "@/lib/services/v2";

interface RegistracePageProps {
    params: Promise<{ id: string }>;
}

const OPTION_FIELD_TYPES = new Set([
    "select",
    "radio",
    "pricing_select",
    "pricing_multi_select",
    "pricing_quantity",
]);

export default async function RegistracePage({
    params,
}: RegistracePageProps) {
    await requireAdmin();
    const { id } = await params;

    const year = await db.year.findUnique({
        where: { id },
        select: {
            id: true,
            year: true,
            title: true,
            registrationOpen: true,
            registrationStartDate: true,
        },
    });

    if (!year) {
        notFound();
    }

    const [summary, submissionCount, formStructure] =
        await Promise.all([
            getRegistrationSummary(year.id),
            countOrders({ yearId: year.id }),
            getFormStructure(year.id),
        ]);

    const allInputFields = formStructure
        ? formStructure.fields
              .filter((f) => OPTION_FIELD_TYPES.has(f.type))
              .map(v2FieldToInputField)
        : [];

    const optionCounts =
        formStructure && allInputFields.length > 0
            ? await getOptionCountsForYear(year.id)
            : undefined;

    const capacityLimits = formStructure?.capacityLimits ?? [];
    const showOptionCounts: string[] = [];
    if (formStructure) {
        const form = await db.registrationForm.findUnique({
            where: { yearId: year.id },
            select: { fields: true },
        });
        if (form) {
            const raw = form.fields as {
                showOptionCounts?: string[];
            };
            if (Array.isArray(raw?.showOptionCounts)) {
                showOptionCounts.push(
                    ...raw.showOptionCounts,
                );
            }
        }
    }

    const mainEmail = await db.emailAccount.findFirst({
        where: { isMain: true },
    });
    const bankAccount = await db.bankAccount.findFirst({
        where: { bankAccountNumber: { not: null } },
    });

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    {
                        label: "Ročníky",
                        href: "/admin/rocniky",
                    },
                    {
                        label: `${year.year}`,
                        href: `/admin/rocniky/${year.id}`,
                    },
                    { label: "Registrace" },
                ]}
                title="Registrace"
            />

            <RegistrationSettings
                yearId={year.id}
                registrationOpen={year.registrationOpen}
                registrationStartDate={
                    year.registrationStartDate
                }
                submissionCount={submissionCount}
                totalPeopleCount={summary.people}
                paidSum={summary.paidTotal}
                unpaidSum={summary.unpaidTotal}
                hasMainEmail={!!mainEmail}
                hasBankAccount={!!bankAccount}
            />

            {formStructure &&
                allInputFields.length > 0 && (
                    <>
                        <Divider sx={{ my: 3 }} />
                        <CapacityLimitsEditor
                            yearId={year.id}
                            capacityLimits={capacityLimits.map(
                                (cl) => ({
                                    id: cl.id,
                                    fieldId: cl.fieldId,
                                    value: cl.optionValue,
                                    maxCount: cl.maxCount,
                                }),
                            )}
                            allInputFields={allInputFields}
                            pricingDefinitions={v2PricingDefsToPricingDefs(
                                formStructure.pricingDefinitions,
                            )}
                            optionCounts={optionCounts}
                        />
                        <Divider sx={{ my: 3 }} />
                        <OptionCountsEditor
                            yearId={year.id}
                            showOptionCounts={
                                showOptionCounts
                            }
                            allInputFields={allInputFields}
                            optionCounts={optionCounts}
                        />
                    </>
                )}

            <Divider sx={{ my: 3 }} />

            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
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
                <LinkButton
                    href={`/admin/rocniky/${year.id}/registrace/success-page`}
                    variant="outlined"
                    startIcon={<CheckCircleOutline />}
                >
                    Úspěšná registrace
                </LinkButton>
            </Box>
        </Container>
    );
}
