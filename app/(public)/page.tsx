import { Box } from "@mui/material";
import { HeroSection, Section, SectionTitle } from "@/components/public/ui";
import { NewsPreview } from "@/components/public/features/news/NewsPreview";
import { GalleryPreview } from "@/components/public/features/gallery/GalleryPreview";
import { RegistrationCTA } from "@/components/public/features/registration/RegistrationCTA";
import { getActiveYear } from "@/lib/services";

export default async function HomePage() {
    const activeYear = await getActiveYear();

    return (
        <>
            <HeroSection
                title={activeYear?.title || "HELMAC"}
                subtitle={
                    activeYear?.subtitle ||
                    "Stredoveka fantasy LARP udalost, kde se pribehy stredoveku misi s magi a dobrodruzstvim"
                }
                ctaText="Registrovat se"
                ctaHref="/registrace"
                secondaryCtaText="Vice o programu"
                secondaryCtaHref="/program"
            />

            <Section>
                <SectionTitle
                    title="Novinky"
                    subtitle="Sledujte nejnovejsi zpravy a aktualizace"
                />
                <NewsPreview />
            </Section>

            <Section backgroundColor="background.paper">
                <SectionTitle
                    title="Galerie"
                    subtitle="Nahlednete do sveta Helmacu"
                />
                <GalleryPreview />
            </Section>

            <Box sx={{ backgroundColor: "primary.main" }}>
                <RegistrationCTA />
            </Box>
        </>
    );
}
