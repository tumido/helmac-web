import { Box, Grid, Typography } from "@mui/material";
import { NewsItem } from "./news.types";
import { NewsFeedItem } from "./NewsFeedItem";

interface NewsFeedProps {
    news: NewsItem[];
    preview?: boolean;
}

export function NewsFeed({ news, preview = false }: NewsFeedProps) {
    if (news.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="text.secondary">
                    Zatím žádné novinky
                </Typography>
            </Box>
        );
    }

    if (!preview) {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {news.map((item) => (
                    <NewsFeedItem key={item.id} news={item} />
                ))}
            </Box>
        );
    }

    const [featured, ...rest] = news;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
            }}
        >
            <NewsFeedItem news={featured} isFeatured />

            {rest.length > 0 && (
                <Grid container spacing={3}>
                    {rest.map((item) => (
                        <Grid item key={item.id} xs={12} md={6}>
                            <NewsFeedItem news={item} truncate />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
