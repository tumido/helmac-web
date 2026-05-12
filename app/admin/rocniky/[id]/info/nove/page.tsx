import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { InfoForm } from "@/components/forms/info-form";
import { PageHeader } from "@/components/admin/page-header";

interface NewInfoPageProps {
    params: Promise<{ id: string }>;
}

export default async function NewInfoPage({ params }: NewInfoPageProps) {
    const { id } = await params;
    const year = await getYearById(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Info", href: `/admin/rocniky/${year.id}/info` },
                    { label: "Nova info sekce" },
                ]}
                title="Nova info sekce"
            />
            <InfoForm mode="create" yearId={year.id} />
        </Container>
    );
}
