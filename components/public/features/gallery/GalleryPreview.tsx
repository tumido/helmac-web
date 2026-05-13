import Link from "next/link";
import { Box, Grid, Button, Typography } from "@mui/material";
import { getLatestAlbumsForActiveYear } from "@/lib/services";
import { AlbumCard } from "./AlbumCard";
import { AnimatedSection } from "@/components/public/ui/AnimatedSection";
import { GameIcon } from "@/lib/icons";

export async function GalleryPreview() {
    const albums = await getLatestAlbumsForActiveYear(4);

    if (albums.length === 0) {
        return (
            <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography color="text.secondary">Zatím žádná alba</Typography>
            </Box>
        );
    }

    return (
        <>
            <Grid container spacing={4} justifyContent="center">
                {albums.map((album, index) => (
                    <Grid item key={album.id} xs={12} sm={6} md={3}>
                        <AnimatedSection delay={index * 100}>
                            <AlbumCard album={album} />
                        </AnimatedSection>
                    </Grid>
                ))}
            </Grid>
            <Box sx={{ textAlign: "center", mt: 6 }}>
                <Link href="/galerie" style={{ textDecoration: "none" }}>
                    <Button
                        variant="outlined"
                        startIcon={
                            <GameIcon
                                name="castle"
                                sx={{ fontSize: "1.2rem" }}
                            />
                        }
                    >
                        Celá galerie
                    </Button>
                </Link>
            </Box>
        </>
    );
}
