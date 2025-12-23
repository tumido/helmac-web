import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { NewsList } from "@/components/public/features/news/NewsList";
import { getLatestNewsForActiveYear } from "@/lib/services";

export const metadata = {
    title: "Novinky | Helmac",
    description: "Novinky a aktuality z akce Helmac",
};

export default async function NovinkyPage() {
    const news = await getLatestNewsForActiveYear(20);

    return (
        <>
            <PageHeader
                title="Novinky"
                subtitle="Sledujte nejnovejsi zpravy a aktualizace"
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <NewsList news={news} />
            </Container>
        </>
    );
}
