import { Box, Typography } from "@mui/material";
import { NewsItem } from "./news.types";
import { NewsFeedItem } from "./NewsFeedItem";

interface NewsFeedProps {
    news: NewsItem[];
}

export function NewsFeed({ news }: NewsFeedProps) {
    if (news.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="text.secondary">
                    Zatím žádné novinky
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                maxWidth: 720,
                mx: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
            }}
        >
            {news.map((item) => (
                <NewsFeedItem key={item.id} news={item} />
            ))}
        </Box>
    );
}
