import { Typography, Box } from "@mui/material";
import { Card } from "@/components/public/ui";
import { storageUrl } from "@/lib/utils/storage";
import { AlbumPreview } from "./gallery.types";

interface AlbumCardProps {
    album: AlbumPreview;
}

export function AlbumCard({ album }: AlbumCardProps) {
    return (
        <Box
            sx={{
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                    transform: "translateY(-4px)",
                    "& .MuiCard-root": {
                        boxShadow:
                            "0 -2px 15px rgba(201,162,39,0.15)",
                    },
                },
            }}
        >
            <a
                href={album.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "inherit" }}
            >
                <Card
                    image={storageUrl(album.coverImage) || album.ogImageUrl || undefined}
                    imageAlt={album.title}
                    imageHeight={180}
                    sx={{ cursor: "pointer" }}
                >
                    <Typography
                        variant="h5"
                        component="h3"
                        gutterBottom
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 600,
                        }}
                    >
                        {album.title}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mb: 0.5 }}
                    >
                        {album.year.year}
                    </Typography>
                    {album.description && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                mb: 2,
                            }}
                        >
                            {album.description}
                        </Typography>
                    )}
                </Card>
            </a>
        </Box>
    );
}
