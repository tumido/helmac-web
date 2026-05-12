import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { RegistrationSuccessContentEditor } from "@/components/admin/registration-success-content-editor";
import type { ContentBlock } from "@/lib/types/content-blocks";

interface SuccessPagePageProps {
    params: Promise<{ id: string }>;
}

async function getYear(yearId: string) {
    return db.year.findUnique({
        where: { id: yearId },
        select: {
            id: true,
            year: true,
            title: true,
            registrationSuccessContent: true,
        },
    });
}

export default async function SuccessPagePage({ params }: SuccessPagePageProps) {
    await requireAdmin();
    const { id } = await params;
    const year = await getYear(id);

    if (!year) {
        notFound();
    }

    return (
        <Container maxWidth={false}>
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Registrace", href: `/admin/rocniky/${year.id}/registrace` },
                    { label: "Úspěšná registrace" },
                ]}
                title="Úspěšná registrace"
            />
            <RegistrationSuccessContentEditor
                yearId={year.id}
                initialContent={year.registrationSuccessContent as unknown as ContentBlock[]}
            />
        </Container>
    );
}
