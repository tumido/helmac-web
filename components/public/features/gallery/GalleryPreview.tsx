import Link from "next/link";
import { Box, Grid, Button, Typography } from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import { getLatestAlbumsForActiveYear } from "@/lib/services";
import { AlbumCard } from "./AlbumCard";

export async function GalleryPreview() {
    const albums = await getLatestAlbumsForActiveYear(4);

    if (albums.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">
                    Zatím žádná alba
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Grid container spacing={4} justifyContent="center">
                {albums.map((album) => (
                    <Grid item key={album.id} xs={12} sm={6} md={3}>
                        <AlbumCard album={album} />
                    </Grid>
                ))}
            </Grid>
            <Box sx={{ textAlign: "center", mt: 4 }}>
                <Link href="/galerie" style={{ textDecoration: "none" }}>
                    <Button variant="outlined" endIcon={<ArrowForward />}>
                        Celá galerie
                    </Button>
                </Link>
            </Box>
        </>
    );
}
