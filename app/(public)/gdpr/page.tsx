import { Container, Typography } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { db } from "@/lib/db";
import { MarkdownContent } from "@/components/ui/markdown-content";

export const metadata = {
    title: "GDPR | Helmáč",
    description: "Ochrana osobních údajů",
};

export default async function GdprPage() {
    const setting = await db.siteSetting.findUnique({
        where: { key: "gdpr" },
    });

    return (
        <>
            <PageHeader title="GDPR" subtitle="Ochrana osobních údajů" icon="locked-chest" />

            <Container maxWidth="md" sx={{ pb: 8 }}>
                {setting?.value ? (
                    <MarkdownContent content={setting.value} />
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        Obsah GDPR zatím nebyl nastaven.
                    </Typography>
                )}
            </Container>
        </>
    );
}
