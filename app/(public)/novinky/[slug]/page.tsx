import { notFound } from "next/navigation";
import { Container, Typography, Box, Chip } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { ArrowBack, Person, CalendarToday } from "@mui/icons-material";
import { PageHeader } from "@/components/public/ui";
import { getNewsBySlugForActiveYear, getActiveYear } from "@/lib/services";

interface NewsDetailPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsDetailPageProps) {
    const { slug } = await params;
    const news = await getNewsBySlugForActiveYear(slug);

    if (!news) {
        return { title: "Clanek nenalezen | Helmac" };
    }

    return {
        title: `${news.title} | Helmac`,
        description: news.excerpt || undefined,
    };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
    const { slug } = await params;
    const [news, activeYear] = await Promise.all([
        getNewsBySlugForActiveYear(slug),
        getActiveYear(),
    ]);

    if (!news) {
        notFound();
    }

    const formattedDate = news.publishedAt
        ? new Date(news.publishedAt).toLocaleDateString("cs-CZ", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : null;

    return (
        <>
            <PageHeader title={news.title} backgroundImage={activeYear?.headerPhoto || undefined} />

            <Container maxWidth="md" sx={{ pb: 8 }}>
                <LinkButton
                    href="/novinky"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 4 }}
                >
                    Zpet na novinky
                </LinkButton>

                {news.coverImage && (
                    <Box
                        component="img"
                        src={news.coverImage}
                        alt={news.title}
                        sx={{
                            width: "100%",
                            height: "auto",
                            maxHeight: 400,
                            objectFit: "cover",
                            borderRadius: 2,
                            mb: 4,
                        }}
                    />
                )}

                <Box
                    sx={{
                        display: "flex",
                        gap: 2,
                        mb: 4,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Chip
                        icon={<Person />}
                        label={news.author.name}
                        variant="outlined"
                        size="small"
                    />
                    {formattedDate && (
                        <Chip
                            icon={<CalendarToday />}
                            label={formattedDate}
                            variant="outlined"
                            size="small"
                        />
                    )}
                </Box>

                {news.excerpt && (
                    <Typography
                        variant="h6"
                        component="p"
                        color="text.secondary"
                        sx={{ mb: 4, fontStyle: "italic" }}
                    >
                        {news.excerpt}
                    </Typography>
                )}

                <Typography
                    variant="body1"
                    component="div"
                    sx={{
                        "& p": { mb: 2 },
                        lineHeight: 1.8,
                    }}
                    dangerouslySetInnerHTML={{ __html: news.content }}
                />
            </Container>
        </>
    );
}
