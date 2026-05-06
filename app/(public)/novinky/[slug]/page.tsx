import { notFound } from "next/navigation";
import { Container, Typography, Box } from "@mui/material";
import { LinkButton } from "@/components/ui/link-button";
import { ArrowBack, CalendarToday } from "@mui/icons-material";
import { PageHeader } from "@/components/public/ui";
import { getNewsBySlugForActiveYear, getActiveYear } from "@/lib/services";
import { formatDate } from "@/lib/utils/date";
import { ContentWithToc } from "@/components/public/features/toc";

interface NewsDetailPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: NewsDetailPageProps) {
    const { slug } = await params;
    const news = await getNewsBySlugForActiveYear(slug);

    if (!news) {
        return { title: "Článek nenalezen | Helmáč" };
    }

    return {
        title: `${news.title} | Helmáč`,
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
        ? formatDate(news.publishedAt)
        : null;

    return (
        <>
            <PageHeader
                title={news.title}
                backgroundImage={activeYear?.headerPhoto || undefined}
            />

            <Container maxWidth="md" sx={{ pb: 8 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 4,
                    }}
                >
                    <LinkButton
                        href="/novinky"
                        variant="outlined"
                        startIcon={<ArrowBack />}
                    >
                        Zpět na novinky
                    </LinkButton>

                    {formattedDate && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <CalendarToday
                                sx={{ color: "primary.main", mt: -0.5 }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontFamily: '"Cinzel", serif',
                                    fontWeight: 600,
                                    color: "primary.main",
                                    pl: 1.5,
                                }}
                            >
                                {formattedDate}
                            </Typography>
                        </Box>
                    )}
                </Box>

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

                <ContentWithToc content={news.content} showToc={news.showToc} />
            </Container>
        </>
    );
}
