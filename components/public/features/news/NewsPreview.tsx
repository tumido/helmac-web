import Link from "next/link";
import { Box, Grid, Button, Typography } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { getLatestNewsForActiveYear } from "@/lib/services";
import { NewsCard } from "./NewsCard";

export async function NewsPreview() {
    const news = await getLatestNewsForActiveYear(3);

    if (news.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">
                    Zatím žádné novinky
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Grid container spacing={4}>
                {news.map((item) => (
                    <Grid item key={item.id} xs={12} sm={6} md={4}>
                        <NewsCard news={item} />
                    </Grid>
                ))}
            </Grid>
            <Box sx={{ textAlign: "center", mt: 4 }}>
                <Link href="/novinky" style={{ textDecoration: "none" }}>
                    <Button variant="outlined" endIcon={<ArrowForward />}>
                        Všechny novinky
                    </Button>
                </Link>
            </Box>
        </>
    );
}
