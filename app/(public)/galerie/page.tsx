import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { AlbumGrid } from "@/components/public/features/gallery/AlbumGrid";
import { getAllPublishedAlbums, getActiveYear } from "@/lib/services";

export const metadata = {
    title: "Galerie | Helmáč",
    description: "Fotogalerie z akce Helmáč",
};

export default async function GaleriePage() {
    const [albums, activeYear] = await Promise.all([
        getAllPublishedAlbums(),
        getActiveYear(),
    ]);

    return (
        <>
            <PageHeader
                title="Galerie"
                subtitle="Nahlédněte do světa Helmáčů skrze naše fotografie"
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <AlbumGrid albums={albums} />
            </Container>
        </>
    );
}
