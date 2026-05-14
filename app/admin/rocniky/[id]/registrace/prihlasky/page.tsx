import { Container, Box, Chip, Alert } from "@mui/material";
import { Download } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { SubmissionsTable } from "@/components/admin/submissions-table";
import { FieldValueFilter } from "@/components/admin/field-value-filter";
import { ValidatePaymentsButton } from "@/components/admin/validate-payments-button";
import { LinkButton } from "@/components/ui/link-button";
import { getAllFields, getAllInputFields } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getFieldOptionValues } from "@/lib/utils/pricing";

interface PrihlaskyPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string; paid?: string; field?: string; value?: string }>;
}

async function getYearWithSubmissions(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            startDate: true,
            registrationForm: { select: { fields: true } },
            registrationSubmissions: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    data: true,
                    status: true,
                    isPaid: true,
                    paidAt: true,
                    totalPrice: true,
                    variableSymbol: true,
                    emailSent: true,
                    adminNote: true,
                    createdAt: true,
                },
            },
        },
    });
}

export default async function PrihlaskyPage({ params, searchParams }: PrihlaskyPageProps) {
    await requireAdmin();
    const { id } = await params;
    const { status, paid, field: fieldParam, value: valueParam } = await searchParams;
    const year = await getYearWithSubmissions(id);

    if (!year) {
        notFound();
    }

    if (!year.registrationForm) {
        return (
            <Container maxWidth="xl">
                <PageHeader
                    breadcrumbs={[
                        { label: "Ročníky", href: "/admin/rocniky" },
                        { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                        { label: "Registrace", href: `/admin/rocniky/${year.id}/registrace` },
                        { label: "Přihlášky" },
                    ]}
                    title="Přihlášky"
                />
                <Alert severity="info" sx={{ mb: 2 }}>
                    Pro zobrazení přihlášek je nutné nejprve vytvořit registrační formulář.
                </Alert>
                <LinkButton
                    href={`/admin/rocniky/${id}/registrace/formular`}
                    variant="contained"
                >
                    Vytvořit formulář
                </LinkButton>
            </Container>
        );
    }

    const formData = migrateFormData(year.registrationForm.fields);
    const fields = getAllFields(formData.fields);
    const allInputFields = getAllInputFields(formData.fields);
    const statusFilter = status &&
        ["PENDING", "CONFIRMED", "WAITLIST", "CANCELLED", "REJECTED"].includes(status)
        ? (status as "PENDING" | "CONFIRMED" | "WAITLIST" | "CANCELLED" | "REJECTED")
        : null;
    const paidFilter = paid === "true" ? true : paid === "false" ? false : null;

    // Build eligible fields for field-value filter (fields with options)
    const filterableFields = allInputFields
        .filter((f) => ["select", "radio", "pricing_select", "pricing_multi_select", "checkbox"].includes(f.type))
        .map((f) => {
            const options = f.type === "checkbox"
                ? ["Ano", "Ne"]
                : getFieldOptionValues(f, formData.pricingDefinitions);
            return { name: f.name, label: f.label, type: f.type, options };
        })
        .filter((f) => f.options.length > 0);

    // Validate field/value params
    const matchedField = fieldParam ? filterableFields.find((f) => f.name === fieldParam) : null;
    const fieldFilter = matchedField ? matchedField.name : null;
    const valueFilter = matchedField && valueParam && matchedField.options.includes(valueParam)
        ? valueParam
        : null;

    const basePath = `/admin/rocniky/${id}/registrace/prihlasky`;
    const statusParam = statusFilter ? `status=${statusFilter}` : "";
    const paidParam = paid === "true" || paid === "false" ? `paid=${paid}` : "";
    const fieldFilterParam = fieldFilter && valueFilter ? `field=${encodeURIComponent(fieldFilter)}` : "";
    const valueFilterParam = fieldFilter && valueFilter ? `value=${encodeURIComponent(valueFilter)}` : "";
    const hasActiveFilter = statusFilter !== null || paidFilter !== null || (fieldFilter !== null && valueFilter !== null);
    const filterQueryString = [statusParam, paidParam, fieldFilterParam, valueFilterParam].filter(Boolean).join("&");

    return (
        <Container maxWidth="xl">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Registrace", href: `/admin/rocniky/${year.id}/registrace` },
                    { label: "Přihlášky" },
                ]}
                title="Přihlášky"
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap", justifyContent: "flex-end" }}>
                <Chip
                    label={`${year.registrationSubmissions.length} registrací`}
                    color="primary"
                    variant="outlined"
                />
                <LinkButton
                    href={`/api/registrace/${year.id}/export`}
                    variant="outlined"
                    startIcon={<Download />}
                    size="small"
                >
                    Export CSV
                </LinkButton>
                {hasActiveFilter && (
                    <LinkButton
                        href={`/api/registrace/${year.id}/export?${filterQueryString}`}
                        variant="outlined"
                        startIcon={<Download />}
                        size="small"
                    >
                        Export filtrovaných CSV
                    </LinkButton>
                )}
                <ValidatePaymentsButton />
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <LinkButton
                    href={`${basePath}${paidParam ? `?${paidParam}` : ""}`}
                    variant={!statusFilter ? "contained" : "outlined"}
                    size="small"
                >
                    Vše
                </LinkButton>
                {(["PENDING", "CONFIRMED", "WAITLIST", "CANCELLED", "REJECTED"] as const).map((s) => {
                    const params = [
                        `status=${s}`,
                        ...(paidParam ? [paidParam] : []),
                    ].join("&");
                    return (
                        <LinkButton
                            key={s}
                            href={`${basePath}?${params}`}
                            variant={statusFilter === s ? "contained" : "outlined"}
                            size="small"
                        >
                            {{
                                PENDING: "Čeká",
                                CONFIRMED: "Potvrzeno",
                                WAITLIST: "Čekací listina",
                                CANCELLED: "Zrušeno",
                                REJECTED: "Zamítnuto",
                            }[s]}
                        </LinkButton>
                    );
                })}
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
                <LinkButton
                    href={`${basePath}${statusParam ? `?${statusParam}` : ""}`}
                    variant={paidFilter === null ? "contained" : "outlined"}
                    size="small"
                >
                    Vše
                </LinkButton>
                <LinkButton
                    href={`${basePath}?${[statusParam, "paid=true"].filter(Boolean).join("&")}`}
                    variant={paidFilter === true ? "contained" : "outlined"}
                    size="small"
                >
                    Zaplaceno
                </LinkButton>
                <LinkButton
                    href={`${basePath}?${[statusParam, "paid=false"].filter(Boolean).join("&")}`}
                    variant={paidFilter === false ? "contained" : "outlined"}
                    size="small"
                >
                    Nezaplaceno
                </LinkButton>
            </Box>
            {filterableFields.length > 0 && (
                <FieldValueFilter
                    basePath={basePath}
                    fields={filterableFields}
                    activeField={fieldFilter}
                    activeValue={valueFilter}
                    otherParams={[statusParam, paidParam].filter(Boolean).join("&")}
                />
            )}
            <SubmissionsTable
                submissions={year.registrationSubmissions}
                fields={fields}
                allInputFields={allInputFields}
                pricingDefinitions={formData.pricingDefinitions}
                yearId={year.id}
                statusFilter={statusFilter}
                paidFilter={paidFilter}
                fieldFilter={fieldFilter}
                valueFilter={valueFilter}
                eventStartDate={year.startDate}
            />
        </Container>
    );
}
