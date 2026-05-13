import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";
import { getLatestNewsForActiveYear } from "@/lib/services";
import { NewsFeed } from "./NewsFeed";
import { NewsActionButton } from "./news.types";
import { DecorativeDivider } from "@/components/public/ui/Divider";
import { GameIcon } from "@/lib/icons";

export async function NewsPreview() {
    const rawNews = await getLatestNewsForActiveYear(3);
    const news = rawNews.map((item) => ({
        ...item,
        actionButtons:
            (item.actionButtons as unknown as NewsActionButton[]) ?? [],
    }));

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
            <NewsFeed news={news} preview />
            <Box sx={{ textAlign: "center", mt: 6 }}>
                <Link href="/novinky" style={{ textDecoration: "none" }}>
                    <Button
                        variant="outlined"
                        startIcon={
                            <GameIcon
                                name="scroll-unfurled"
                                sx={{ fontSize: "1.2rem" }}
                            />
                        }
                    >
                        Všechny novinky
                    </Button>
                </Link>
            </Box>
        </>
    );
}
