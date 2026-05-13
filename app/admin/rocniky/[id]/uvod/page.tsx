import { Container, Box, Typography } from "@mui/material";
import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { getHomepageStepsForYear } from "@/lib/services/homepage-steps";
import { PageHeader } from "@/components/admin/page-header";
import { HomepageStepsList } from "@/components/admin/homepage-steps-list";

interface UvodPageProps {
    params: Promise<{ id: string }>;
}

export default async function UvodPage({
    params,
}: UvodPageProps) {
    const { id } = await params;
    const [year, steps] = await Promise.all([
        getYearById(id),
        getHomepageStepsForYear(id),
    ]);

    if (!year) {
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
                        label: `${year.year}`,
                        href: `/admin/rocniky/${year.id}`,
                    },
                    { label: "Úvodní stránka" },
                ]}
                title="Úvodní stránka"
            />

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "1fr 1fr",
                    },
                    gap: 3,
                    alignItems: "start",
                }}
            >
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1.5, color: "text.secondary" }}
                    >
                        Jak se zúčastnit
                    </Typography>
                    <HomepageStepsList
                        yearId={year.id}
                        steps={steps}
                    />
                </Box>
            </Box>
        </Container>
    );
}
