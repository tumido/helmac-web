import { Metadata } from "next";
import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { NewsFeed } from "@/components/public/features/news/NewsFeed";
import { NewsActionButton } from "@/components/public/features/news";
import { getLatestNewsForActiveYear } from "@/lib/services";

export const metadata: Metadata = {
    title: "Novinky | Helmáč",
    description: "Novinky a aktuality z akce Helmáč",
};

export default async function NovinkyPage() {
    const rawNews = await getLatestNewsForActiveYear(100);
    const news = rawNews.map((item) => ({
        ...item,
        actionButtons:
            (item.actionButtons as unknown as NewsActionButton[]) ?? [],
    }));

    return (
        <>
            <PageHeader
                title="Novinky"
                subtitle="Sledujte nejnovější zprávy a aktualizace"
                icon="trumpet-flag"
            />
            <Container maxWidth="lg" sx={{ pt: 4, pb: 8, px: { lg: "220px" } }}>
                <NewsFeed news={news} />
            </Container>
        </>
    );
}
