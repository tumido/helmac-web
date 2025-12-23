import {
    Container,
    Typography,
    Card,
    CardContent,
    CardActions,
    Box,
    Button,
    Chip,
} from "@mui/material";
import {
    Add,
    Edit,
    Visibility,
    VisibilityOff,
    PhotoLibrary,
} from "@mui/icons-material";
import Link from "next/link";
import { db } from "@/lib/db";
import { AlbumActions } from "@/components/admin/album-actions";

async function getAlbums() {
    return db.album.findMany({
        orderBy: [{ year: { year: "desc" } }, { sortOrder: "asc" }],
        include: {
            year: {
                select: { year: true, title: true },
            },
            _count: {
                select: { images: true },
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

export default async function GalleryPage() {
    const [albums, years] = await Promise.all([getAlbums(), getYears()]);

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
                <Typography variant="h4">Galerie</Typography>
                {years.length > 0 && (
                    <Button
                        component={Link}
                        href="/admin/galerie/nove"
                        variant="contained"
                        startIcon={<Add />}
                    >
                        Nove album
                    </Button>
                )}
            </Box>

            {years.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Nejprve vytvorte rocnik pro pridavani alb.
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
            ) : albums.length === 0 ? (
                <Card>
                    <CardContent>
                        <Typography color="text.secondary" textAlign="center">
                            Zatim nebyla vytvorena zadna alba.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: {
                            xs: "1fr",
                            sm: "repeat(2, 1fr)",
                            lg: "repeat(3, 1fr)",
                        },
                        gap: 3,
                    }}
                >
                    {albums.map((album) => (
                        <Card key={album.id}>
                            <Box
                                sx={{
                                    height: 160,
                                    backgroundColor: "grey.200",
                                    backgroundImage: album.coverImage
                                        ? `url(${album.coverImage})`
                                        : "none",
                                    backgroundSize: "cover",
                                    backgroundPosition: "center",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {!album.coverImage && (
                                    <PhotoLibrary
                                        sx={{ fontSize: 48, color: "grey.400" }}
                                    />
                                )}
                            </Box>
                            <CardContent>
                                <Typography variant="h6" noWrap>
                                    {album.title}
                                </Typography>

                                <Box sx={{ display: "flex", gap: 1, my: 1 }}>
                                    <Chip
                                        label={album.year.year}
                                        size="small"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`${album._count.images} obrazku`}
                                        size="small"
                                        variant="outlined"
                                        icon={<PhotoLibrary />}
                                    />
                                    <Chip
                                        label={
                                            album.isPublished
                                                ? "Publikovano"
                                                : "Skryto"
                                        }
                                        size="small"
                                        color={
                                            album.isPublished ? "success" : "default"
                                        }
                                        icon={
                                            album.isPublished ? (
                                                <Visibility />
                                            ) : (
                                                <VisibilityOff />
                                            )
                                        }
                                    />
                                </Box>

                                {album.description && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                        }}
                                    >
                                        {album.description}
                                    </Typography>
                                )}
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
                                    href={`/admin/galerie/${album.id}`}
                                    size="small"
                                    startIcon={<Edit />}
                                >
                                    Upravit
                                </Button>
                                <AlbumActions
                                    albumId={album.id}
                                    isPublished={album.isPublished}
                                />
                            </CardActions>
                        </Card>
                    ))}
                </Box>
            )}
        </Container>
    );
}
