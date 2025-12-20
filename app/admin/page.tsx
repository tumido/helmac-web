import {
    Container,
    Typography,
    Card,
    CardContent,
    Box,
} from "@mui/material";
import {
    CalendarMonth,
    Article,
    Newspaper,
    PhotoLibrary,
} from "@mui/icons-material";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getStats() {
    const [yearsCount, pagesCount, newsCount, albumsCount] = await Promise.all([
        db.year.count(),
        db.page.count(),
        db.news.count(),
        db.album.count(),
    ]);

    return { yearsCount, pagesCount, newsCount, albumsCount };
}

export default async function AdminDashboardPage() {
    const session = await auth();
    const stats = await getStats();

    const statCards = [
        {
            title: "Rocniky",
            value: stats.yearsCount,
            icon: CalendarMonth,
            color: "#1976d2",
        },
        {
            title: "Stranky",
            value: stats.pagesCount,
            icon: Article,
            color: "#388e3c",
        },
        {
            title: "Novinky",
            value: stats.newsCount,
            icon: Newspaper,
            color: "#f57c00",
        },
        {
            title: "Alba",
            value: stats.albumsCount,
            icon: PhotoLibrary,
            color: "#7b1fa2",
        },
    ];

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Vitejte, {session?.user?.name || "Admine"}!
            </Typography>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(4, 1fr)",
                    },
                    gap: 3,
                }}
            >
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title}>
                            <CardContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            backgroundColor: card.color,
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Icon />
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="h4"
                                            fontWeight="bold"
                                        >
                                            {card.value}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {card.title}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>

            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Rychle akce
                </Typography>
                <Typography color="text.secondary">
                    Vyberte polozku z menu vlevo pro spravu obsahu.
                </Typography>
            </Box>
        </Container>
    );
}
