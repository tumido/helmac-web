import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { NewsFeed } from "@/components/public/features/news/NewsFeed";
import { getLatestNewsForActiveYear, getActiveYear } from "@/lib/services";

export const metadata = {
    title: "Novinky | Helmáč",
    description: "Novinky a aktuality z akce Helmáč",
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
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <NewsFeed news={news} />
            </Container>
        </>
    );
}
