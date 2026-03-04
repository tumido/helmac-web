import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { NewsList } from "@/components/public/features/news/NewsList";
import { getLatestNewsForActiveYear, getActiveYear } from "@/lib/services";

export const metadata = {
    title: "Novinky | Helmac",
    description: "Novinky a aktuality z akce Helmac",
};

export default async function NovinkyPage() {
    const [news, activeYear] = await Promise.all([
        getLatestNewsForActiveYear(20),
        getActiveYear(),
    ]);

    return (
        <>
            <PageHeader
                title="Novinky"
                subtitle="Sledujte nejnovější zprávy a aktualizace"
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <NewsList news={news} />
            </Container>
        </>
    );
}
