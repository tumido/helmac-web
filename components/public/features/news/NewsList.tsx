import { Grid, Box, Typography } from "@mui/material";
import { NewsItem } from "./news.types";
import { NewsCard } from "./NewsCard";

interface NewsListProps {
    news: NewsItem[];
}

export function NewsList({ news }: NewsListProps) {
    if (news.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="text.secondary">
                    Zatim zadne novinky
                </Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={4}>
            {news.map((item) => (
                <Grid item key={item.id} xs={12} sm={6} md={4}>
                    <NewsCard news={item} />
                </Grid>
            ))}
        </Grid>
    );
}
