import Link from "next/link";
import { Typography, Box } from "@mui/material";
import { Card } from "@/components/public/ui";
import { NewsItem } from "./news.types";
import { formatDate } from "@/lib/utils/date";

interface NewsCardProps {
    news: NewsItem;
}

export function NewsCard({ news }: NewsCardProps) {
    const formattedDate = news.publishedAt
        ? formatDate(news.publishedAt)
        : null;

    return (
        <Link
            href={`/novinky/${news.slug}`}
            style={{ textDecoration: "none", color: "inherit" }}
        >
            <Card
                image={news.coverImage || undefined}
                imageAlt={news.title}
                imageHeight={180}
                sx={{ cursor: "pointer" }}
            >
                <Box sx={{ flex: 1 }}>
                    <Typography
                        variant="h5"
                        component="h3"
                        gutterBottom
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 600,
                        }}
                    >
                        {news.title}
                    </Typography>
                    {news.excerpt && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                mb: 2,
                            }}
                        >
                            {news.excerpt}
                        </Typography>
                    )}
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        alignItems: "center",
                        mt: "auto",
                        pt: 2,
                        borderTop: 1,
                        borderColor: "divider",
                    }}
                >
                    {formattedDate && (
                        <Typography variant="caption" color="text.secondary">
                            {formattedDate}
                        </Typography>
                    )}
                </Box>
            </Card>
        </Link>
    );
}
