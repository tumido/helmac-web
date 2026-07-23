import { Container } from "@mui/material";
import { notFound } from "next/navigation";
import { requireEditor } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { SubmissionDetail } from "@/components/admin/submission-detail";
import { getOrderByLegacyId } from "@/lib/services/v2";
import type { RegistrationStatus } from "@prisma/client";

interface SubmissionDetailPageProps {
    params: Promise<{
        id: string;
        submissionId: string;
    }>;
}

export default async function SubmissionDetailPage({
    params,
}: SubmissionDetailPageProps) {
    const session = await requireEditor();
    const isEditor = session.user?.role === "EDITOR";
    const { id: yearId, submissionId } = await params;
    const order = await getOrderByLegacyId(submissionId);

    if (!order || order.yearId !== yearId) {
        notFound();
    }

    if (isEditor && !order.isTest) {
        notFound();
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    {
                        label: "Ročníky",
                        href: "/admin/rocniky",
                    },
                    {
                        label: `${order.yearNumber} - ${order.yearTitle}`,
                        href: `/admin/rocniky/${yearId}`,
                    },
                    {
                        label: "Registrace",
                        href: `/admin/rocniky/${yearId}/registrace`,
                    },
                    {
                        label: "Přihlášky",
                        href: `/admin/rocniky/${yearId}/registrace/prihlasky`,
                    },
                    { label: "Detail registrace" },
                ]}
                title="Detail registrace"
            />
            <SubmissionDetail
                order={{
                    ...order,
                    status: order.status as RegistrationStatus,
                    createdAt: order.createdAt.toISOString(),
                    paidAt:
                        order.paidAt?.toISOString() ??
                        null,
                    emailSentAt:
                        order.emailSentAt?.toISOString() ??
                        null,
                }}
                yearId={yearId}
                readOnly={isEditor}
            />
        </Container>
    );
}
