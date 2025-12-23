import {
    Container,
    Typography,
    Card,
    CardContent,
    CardActions,
    Box,
    Button,
    Chip,
    IconButton,
    Tooltip,
} from "@mui/material";
import { Add, Edit, Visibility, VisibilityOff } from "@mui/icons-material";
import Link from "next/link";
import { db } from "@/lib/db";
import { NewsActions } from "@/components/admin/news-actions";

async function getNews() {
    return db.news.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            year: {
                select: { year: true, title: true },
            },
            author: {
                select: { name: true },
            },
        },
    });
}

async function getYears() {
    return db.year.findMany({
        where: { isArchived: false },
        orderBy: { year: "desc" },
        select: { id: true, year: true, title: true },
    });
}

export default async function NewsListPage() {
    const [news, years] = await Promise.all([getNews(), getYears()]);

    return (
        <Container maxWidth="lg">
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                }}
            >
                <Typography variant="h4">Novinky</Typography>
                {years.length > 0 && (
                    <Button
                        component={Link}
                        href="/admin/novinky/nova"
                        variant="contained"
                        startIcon={<Add />}
                    >
                        Nova novinka
                    </Button>
                )}
            </Box>

            {years.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Nejprve vytvorte rocnik pro pridavani novinek.
                        </Typography>
                        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                            <Button
                                component={Link}
                                href="/admin/rocniky/novy"
                                variant="outlined"
                            >
                                Vytvorit rocnik
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            ) : news.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Zatim nebyly vytvoreny zadne novinky.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2, 1fr)",
                            lg: "repeat(3, 1fr)",
                        },
                        gap: 3,
                    }}
                >
                    {news.map((item) => (
                        <Card key={item.id}>
                            {item.coverImage && (
                                <Box
                                    sx={{
                                        height: 140,
                                        backgroundImage: `url(${item.coverImage})`,
                                        backgroundSize: "cover",
                                        backgroundPosition: "center",
                                    }}
                                />
                            )}
                            <CardContent>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 1,
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                        }}
                                    >
                                        {item.title}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                                    <Chip
                                        label={item.year.year}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={item.isPublished ? "Publikovano" : "Skryto"}
                                        size="small"
                                        color={item.isPublished ? "success" : "default"}
                                        icon={
                                            item.isPublished ? (
                                                <Visibility />
                                            ) : (
                                                <VisibilityOff />
                                            )
                                        }
                                    />
                                </Box>

                                {item.excerpt && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: "vertical",
                                            mb: 2,
                                        }}
                                    >
                                        {item.excerpt}
                                    </Typography>
                                )}

                                <Typography variant="caption" color="text.secondary">
                                    {item.author.name} •{" "}
                                    {new Date(item.createdAt).toLocaleDateString("cs-CZ")}
                                </Typography>
                            </CardContent>

                            <CardActions
                                sx={{
                                    justifyContent: "space-between",
                                    px: 2,
                                    pb: 2,
                                }}
                            >
                                <Button
                                    component={Link}
                                    href={`/admin/novinky/${item.id}`}
                                    size="small"
                                    startIcon={<Edit />}
                                >
                                    Upravit
                                </Button>
                                <NewsActions
                                    newsId={item.id}
                                    isPublished={item.isPublished}
                                />
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            )}
        </Container>
    );
}
