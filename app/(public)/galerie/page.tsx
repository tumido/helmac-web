import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { AlbumGrid } from "@/components/public/features/gallery/AlbumGrid";
import { getAllPublishedAlbums } from "@/lib/services";

export const metadata = {
    title: "Galerie | Helmáč",
    description: "Fotogalerie z akce Helmáč",
};

export default async function GaleriePage() {
    const albums = await getAllPublishedAlbums();

    return (
        <>
            <PageHeader
                title="Galerie"
                subtitle="Nahlédněte do světa Helmáče skrze naše fotografie"
                icon="wood-frame"
            />
            <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
                <AlbumGrid albums={albums} />
            </Container>
        </>
    );
}
