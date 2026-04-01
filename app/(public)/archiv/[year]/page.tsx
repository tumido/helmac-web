import { notFound } from "next/navigation";
import {
    Container,
    Grid,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import { LinkButton, ListItemLinkButton } from "@/components/ui/link-button";
import { ArrowBack, Article, PhotoLibrary, Newspaper } from "@mui/icons-material";
import { PageHeader, Card } from "@/components/public/ui";
import { getYearByNumber } from "@/lib/services";
import { formatDate } from "@/lib/utils/date";

interface ArchiveYearPageProps {
    params: Promise<{ year: string }>;
}

export async function generateMetadata({ params }: ArchiveYearPageProps) {
    const { year: yearParam } = await params;
    const yearNumber = parseInt(yearParam, 10);
    const year = await getYearByNumber(yearNumber);

    if (!year) {
        return { title: "Rocnik nenalezen | Helmac" };
    }

    return {
        title: `${year.title} (${year.year}) | Archiv | Helmac`,
        description: year.subtitle || undefined,
    };
}

export default async function ArchiveYearPage({
    params,
}: ArchiveYearPageProps) {
    const { year: yearParam } = await params;
    const yearNumber = parseInt(yearParam, 10);

    if (isNaN(yearNumber)) {
        notFound();
    }

    const year = await getYearByNumber(yearNumber);

    if (!year) {
        notFound();
    }

    return (
        <>
            <PageHeader title={year.title} subtitle={year.subtitle || undefined} backgroundImage={year.headerPhoto || undefined} />

            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <LinkButton
                    href="/archiv"
                    startIcon={<ArrowBack />}
                    sx={{ mb: 4 }}
                >
                    Zpet na archiv
                </LinkButton>

                <Grid container spacing={4}>
                    {year.pages.length > 0 && (
                        <Grid item xs={12} md={4}>
                            <Card>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 2,
                                    }}
                                >
                                    <Article color="primary" />
                                    <Typography variant="h6">
                                        Stranky
                                    </Typography>
                                </Box>
                                <List disablePadding>
                                    {year.pages.map((page) => (
                                        <ListItem key={page.id} disablePadding>
                                            <ListItemLinkButton
                                                href={`/archiv/${year.year}/${page.slug}`}
                                            >
                                                <ListItemText
                                                    primary={page.title}
                                                />
                                            </ListItemLinkButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Card>
                        </Grid>
                    )}

                    {year.albums.length > 0 && (
                        <Grid item xs={12} md={4}>
                            <Card>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 2,
                                    }}
                                >
                                    <PhotoLibrary color="primary" />
                                    <Typography variant="h6">
                                        Galerie
                                    </Typography>
                                </Box>
                                <List disablePadding>
                                    {year.albums.map((album) => (
                                        <ListItem key={album.id} disablePadding>
                                            <ListItemLinkButton
                                                href={album.externalUrl}
                                            >
                                                <ListItemText
                                                    primary={album.title}
                                                />
                                            </ListItemLinkButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Card>
                        </Grid>
                    )}

                    {year.news.length > 0 && (
                        <Grid item xs={12} md={4}>
                            <Card>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mb: 2,
                                    }}
                                >
                                    <Newspaper color="primary" />
                                    <Typography variant="h6">
                                        Novinky
                                    </Typography>
                                </Box>
                                <List disablePadding>
                                    {year.news.map((item) => (
                                        <ListItem key={item.id} disablePadding>
                                            <ListItemLinkButton
                                                href={`/novinky/${item.slug}`}
                                            >
                                                <ListItemText
                                                    primary={item.title}
                                                    secondary={
                                                        item.publishedAt
                                                            ? formatDate(item.publishedAt)
                                                            : undefined
                                                    }
                                                />
                                            </ListItemLinkButton>
                                        </ListItem>
                                    ))}
                                </List>
                            </Card>
                        </Grid>
                    )}
                </Grid>

                {year.pages.length === 0 &&
                    year.albums.length === 0 &&
                    year.news.length === 0 && (
                        <Box sx={{ textAlign: "center", py: 8 }}>
                            <Typography color="text.secondary">
                                Zadny obsah pro tento rocnik
                            </Typography>
                        </Box>
                    )}
            </Container>
        </>
    );
}
