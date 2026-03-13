import { Typography, Box } from "@mui/material";
import { OpenInNew } from "@mui/icons-material";
import { Card } from "@/components/public/ui";
import { AlbumPreview } from "./gallery.types";

interface AlbumCardProps {
    album: AlbumPreview;
}

export function AlbumCard({ album }: AlbumCardProps) {
    return (
        <a
            href={album.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none", color: "inherit" }}
        >
            <Card
                image={album.coverImage || undefined}
                imageAlt={album.title}
                imageHeight={200}
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
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: "auto",
                        color: "text.secondary",
                    }}
                >
                    <OpenInNew fontSize="small" />
                    <Typography variant="caption">
                        Otevřít galerii
                    </Typography>
                </Box>
            </Card>
        </a>
    );
}
