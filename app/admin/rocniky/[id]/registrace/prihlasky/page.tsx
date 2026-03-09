import { Container, Typography, Box, Chip } from "@mui/material";
import { Download } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { SubmissionsTable } from "@/components/admin/submissions-table";
import { LinkButton } from "@/components/ui/link-button";
import { getAllFields } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";

interface PrihlaskyPageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string }>;
}

async function getYearWithSubmissions(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            registrationForm: { select: { fields: true } },
            registrationSubmissions: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    data: true,
                    status: true,
                    isPaid: true,
                    paidAt: true,
                    createdAt: true,
                },
            },
        },
    });
}

export default async function PrihlaskyPage({ params, searchParams }: PrihlaskyPageProps) {
    const { id } = await params;
    const { status } = await searchParams;
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

    return (
        <Container maxWidth="lg">
            <AdminBreadcrumbs
                items={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Registrace", href: `/admin/rocniky/${year.id}/registrace` },
                    { label: "Přihlášky" },
                ]}
            />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
                <Typography variant="h4" sx={{ flex: 1 }}>
                    Přihlášky
                </Typography>
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
                    href={`/admin/rocniky/${id}/registrace/prihlasky`}
                    variant={!statusFilter ? "contained" : "outlined"}
                    size="small"
                >
                    Vše
                </LinkButton>
                {(["PENDING", "CONFIRMED", "WAITLIST", "CANCELLED", "REJECTED"] as const).map((s) => (
                    <LinkButton
                        key={s}
                        href={`/admin/rocniky/${id}/registrace/prihlasky?status=${s}`}
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
                ))}
            </Box>
            <SubmissionsTable
                submissions={year.registrationSubmissions}
                fields={fields}
                yearId={year.id}
                statusFilter={statusFilter}
            />
        </Container>
    );
}
