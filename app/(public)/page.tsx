import { Box, Typography } from "@mui/material";
import { HeroSection, Section, SectionTitle } from "@/components/public/ui";
import { formatDate } from "@/lib/utils/date";
import { NewsPreview } from "@/components/public/features/news/NewsPreview";
import { GalleryPreview } from "@/components/public/features/gallery/GalleryPreview";
import { RegistrationCTA } from "@/components/public/features/registration/RegistrationCTA";
import { getActiveYear, getRegistrationStatus } from "@/lib/services";

export default async function HomePage() {
    const [activeYear, regStatus] = await Promise.all([
        getActiveYear(),
        getRegistrationStatus(),
    ]);

    return (
        <>
            <HeroSection
                title={activeYear?.title || "HELMAC"}
                backgroundImage={activeYear?.heroPhoto || undefined}
                subtitle={
                    activeYear?.subtitle ||
                    "Středověká fantasy LARP událost, kde se příběhy středověku mísí s magií a dobrodružstvím"
                }
                ctaText={regStatus.isOpen ? "Registrovat se" : undefined}
                ctaHref={regStatus.isOpen ? "/registrace" : undefined}
                secondaryCtaText="Vice o programu"
                secondaryCtaHref="/program"
            >
                {!regStatus.isOpen && regStatus.registrationStartDate && (
                    <Typography
                        variant="h6"
                        sx={{
                            opacity: 0.85,
                            fontFamily: '"Merriweather", serif',
                            fontWeight: 300,
                        }}
                    >
                        Registrace se otevře {formatDate(regStatus.registrationStartDate)}
                    </Typography>
                )}
            </HeroSection>

            <Section>
                <SectionTitle
                    title="Novinky"
                    subtitle="Sledujte nejnovější zprávy a aktualizace"
                />
                <NewsPreview />
            </Section>

            <Section backgroundColor="background.paper">
                <SectionTitle
                    title="Galerie"
                    subtitle="Nahlédněte do světa Helmaců"
                />
                <GalleryPreview />
            </Section>

            <Box sx={{ backgroundColor: "primary.main" }}>
                <RegistrationCTA />
            </Box>
        </>
    );
}
