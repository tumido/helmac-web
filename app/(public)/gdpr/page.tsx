import { Container, Typography } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { db } from "@/lib/db";
import { richContentSx } from "@/lib/utils/rich-content-sx";

export const metadata = {
    title: "GDPR | Helmac",
    description: "Ochrana osobních údajů",
};

export default async function GdprPage() {
    const setting = await db.siteSetting.findUnique({
        where: { key: "gdpr" },
    });

    return (
        <>
            <PageHeader title="GDPR" subtitle="Ochrana osobních údajů" />

            <Container maxWidth="md" sx={{ pb: 8 }}>
                {setting?.value ? (
                    <Typography
                        variant="body1"
                        component="div"
                        sx={richContentSx}
                        dangerouslySetInnerHTML={{ __html: setting.value }}
                    />
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        Obsah GDPR zatím nebyl nastaven.
                    </Typography>
                )}
            </Container>
        </>
    );
}
