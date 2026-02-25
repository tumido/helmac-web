import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { AlbumGrid } from "@/components/public/features/gallery/AlbumGrid";
import { getAllPublishedAlbums } from "@/lib/services";

export const metadata = {
    title: "Galerie | Helmac",
    description: "Fotogalerie z akce Helmac",
};

export default async function GaleriePage() {
    const albums = await getAllPublishedAlbums();

    return (
        <>
            <PageHeader
                title="Galerie"
                subtitle="Nahlednete do sveta Helmacu skrze nase fotografie"
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <AlbumGrid albums={albums} />
            </Container>
        </>
    );
}
