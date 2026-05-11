import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { CalendarToday } from "@mui/icons-material";
import { NewsItem } from "./news.types";
import { formatDate } from "@/lib/utils/date";

interface NewsFeedItemProps {
    news: NewsItem;
}

export function NewsFeedItem({ news }: NewsFeedItemProps) {
    const formattedDate = news.publishedAt
        ? formatDate(news.publishedAt)
        : null;

    return (
        <Box>
            {/* Date header — matches TimeSection from Program */}
            {formattedDate && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <CalendarToday sx={{ color: "primary.main" }} />
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
                    <Box
                        sx={{
                            flex: 1,
                            height: 1,
                            backgroundColor: "divider",
                            ml: 2,
                        }}
                    />
                </Box>
            )}

            {/* Timeline line + content — matches EventCard layout */}
            <Box
                sx={{
                    display: "flex",
                    position: "relative",
                    ml: { xs: 1, sm: "10px" },
                }}
            >
                <Box
                    sx={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        backgroundColor: "primary.main",
                        borderRadius: 1,
                    }}
                />

                <Link
                    href={`/novinky/${news.slug}`}
                    style={{
                        textDecoration: "none",
                        color: "inherit",
                        flex: 1,
                    }}
                >
                    <Box
                        sx={{
                            ml: 3,
                            px: 2,
                            py: 1.5,
                            borderRadius: 2,
                            transition:
                                "background-color 0.2s ease, box-shadow 0.2s ease",
                            "&:hover": {
                                backgroundColor: "background.paper",
                                boxShadow: "0 0 0 1px background.paper",
                            },
                        }}
                    >
                        {news.coverImage && (
                            <Box
                                component="img"
                                src={news.coverImage}
                                alt={news.title}
                                sx={{
                                    width: "100%",
                                    maxHeight: 220,
                                    objectFit: "cover",
                                    borderRadius: 2,
                                    mb: 2,
                                    display: "block",
                                }}
                            />
                        )}

                        <Typography
                            variant="h6"
                            component="h3"
                            sx={{
                                fontFamily: '"Cinzel", serif',
                                fontWeight: 700,
                                fontSize: {
                                    xs: "1.1rem",
                                    sm: "1.25rem",
                                },
                                textTransform: "uppercase",
                                letterSpacing: "0.02em",
                                lineHeight: 1.3,
                                mb: 1,
                            }}
                        >
                            {news.title}
                        </Typography>

                        {news.excerpt && (
                            <Typography variant="body2" color="text.secondary">
                                {news.excerpt}
                            </Typography>
                        )}
                    </Box>
                </Link>
            </Box>
        </Box>
    );
}
