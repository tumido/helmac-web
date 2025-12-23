import { Container, Typography, Box, Button, Chip } from "@mui/material";
import { ArrowBack, Visibility, VisibilityOff } from "@mui/icons-material";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageForm } from "@/components/forms/page-form";

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
            <Box sx={{ mb: 4 }}>
                <Button
                    component={Link}
                    href={`/admin/rocniky/${page.year.id}`}
                    startIcon={<ArrowBack />}
                    sx={{ mb: 2 }}
                >
                    Zpet na rocnik {page.year.year}
                </Button>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <Typography variant="h4">Upravit stranku</Typography>
                    <Chip
                        label={page.isPublished ? "Publikovano" : "Skryto"}
                        size="small"
                        color={page.isPublished ? "success" : "default"}
                        icon={
                            page.isPublished ? <Visibility /> : <VisibilityOff />
                        }
                    />
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
