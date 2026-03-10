import { Container, Typography, Box, Chip, Button } from "@mui/material";
import { Visibility, VisibilityOff, OpenInNew } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageForm } from "@/components/forms/page-form";
import { PageHeader } from "@/components/admin/page-header";

interface EditPageProps {
    params: Promise<{ id: string; pageId: string }>;
}

async function getPageWithYear(pageId: string) {
    return db.page.findUnique({
        where: { id: pageId },
        include: {
            year: {
                select: { id: true, year: true, title: true },
            },
        },
    });
}

export default async function EditPagePage({ params }: EditPageProps) {
    const { id, pageId } = await params;
    const page = await getPageWithYear(pageId);

    if (!page || page.yearId !== id) {
        notFound();
    }

    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: `${page.year.year}`, href: `/admin/rocniky/${page.year.id}` },
                    { label: page.title },
                ]}
                title="Upravit stranku"
            />
            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <Chip
                        label={page.isPublished ? "Publikovano" : "Skryto"}
                        size="small"
                        color={page.isPublished ? "success" : "default"}
                        icon={
                            page.isPublished ? <Visibility /> : <VisibilityOff />
                        }
                    />
                    <Button
                        href={`/${page.year.year}/${page.slug}`}
                        target="_blank"
                        variant="outlined"
                        startIcon={<OpenInNew />}
                    >
                        Nahled
                    </Button>
                </Box>
                <Typography color="text.secondary">
                    {page.year.year} - {page.title}
                </Typography>
            </Box>

            <PageForm
                mode="edit"
                yearId={page.year.id}
                pageId={page.id}
                defaultValues={{
                    slug: page.slug,
                    title: page.title,
                    seoTitle: page.seoTitle,
                    seoDesc: page.seoDesc,
                    sortOrder: page.sortOrder,
                }}
            />
        </Container>
    );
}
