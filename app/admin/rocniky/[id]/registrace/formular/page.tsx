import { Container, Typography, Box } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";
import { FormBuilder } from "@/components/admin/form-builder";
import { migrateFormData } from "@/lib/utils/form-migration";

interface FormularPageProps {
    params: Promise<{ id: string }>;
}

async function getYearWithForm(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            registrationForm: { select: { id: true, fields: true } },
        },
    });
}

export default async function FormularPage({ params }: FormularPageProps) {
    const { id } = await params;
    const year = await getYearWithForm(id);

    if (!year) {
        notFound();
    }

    const formData = migrateFormData(year.registrationForm?.fields);

    return (
        <Container maxWidth="lg">
            <AdminBreadcrumbs
                items={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Registrace", href: `/admin/rocniky/${year.id}/registrace` },
                    { label: "Formulář" },
                ]}
            />
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4">Registrační formulář</Typography>
            </Box>
            <FormBuilder yearId={year.id} initialFormData={formData} />
        </Container>
    );
}
