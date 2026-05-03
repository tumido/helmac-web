import { Grid, Box, Typography } from "@mui/material";
import { AlbumPreview } from "./gallery.types";
import { AlbumCard } from "./AlbumCard";

interface AlbumGridProps {
    albums: AlbumPreview[];
}

export function AlbumGrid({ albums }: AlbumGridProps) {
    if (albums.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography color="text.secondary">Zatím žádná alba</Typography>
            </Box>
        );
    }

    return (
        <Grid container spacing={4}>
            {albums.map((album) => (
                <Grid item key={album.id} xs={12} sm={6} md={4}>
                    <AlbumCard album={album} />
                </Grid>
            ))}
        </Grid>
    );
}
