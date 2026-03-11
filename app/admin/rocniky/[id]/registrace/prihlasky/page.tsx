import { Container, Box, Chip } from "@mui/material";
import { Download } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { SubmissionsTable } from "@/components/admin/submissions-table";
import { LinkButton } from "@/components/ui/link-button";
import { getAllFields } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";

interface PrihlaskyPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string; paid?: string }>;
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
                    createdAt: true,
                },
            },
        },
    });
}

export default async function PrihlaskyPage({ params, searchParams }: PrihlaskyPageProps) {
    const { id } = await params;
    const { status, paid } = await searchParams;
    const year = await getYearWithSubmissions(id);

    if (!year || !year.registrationForm) {
        notFound();
    }

    const formData = migrateFormData(year.registrationForm.fields);
    const fields = getAllFields(formData.fields);
    const statusFilter = status &&
        ["PENDING", "CONFIRMED", "WAITLIST", "CANCELLED", "REJECTED"].includes(status)
        ? (status as "PENDING" | "CONFIRMED" | "WAITLIST" | "CANCELLED" | "REJECTED")
        : null;
    const paidFilter = paid === "true" ? true : paid === "false" ? false : null;

    const basePath = `/admin/rocniky/${id}/registrace/prihlasky`;
    const statusParam = statusFilter ? `status=${statusFilter}` : "";
    const paidParam = paid === "true" || paid === "false" ? `paid=${paid}` : "";

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
            <SubmissionsTable
                submissions={year.registrationSubmissions}
                fields={fields}
                yearId={year.id}
                statusFilter={statusFilter}
                paidFilter={paidFilter}
                eventStartDate={year.startDate}
            />
        </Container>
    );
}
