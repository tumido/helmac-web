import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { getLatestNewsForActiveYear } from "@/lib/services";
import { NewsFeed } from "./NewsFeed";

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
            <NewsFeed news={news} />
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
