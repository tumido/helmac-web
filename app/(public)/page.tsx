import { Box, Typography } from "@mui/material";
import { HeroSection, Section, SectionTitle } from "@/components/public/ui";
import { DecorativeDivider } from "@/components/public/ui/Divider";
import { formatDate, formatEventDateRange } from "@/lib/utils/date";
import { storageUrl } from "@/lib/utils/storage";
import { NewsPreview } from "@/components/public/features/news/NewsPreview";
import { GalleryPreview } from "@/components/public/features/gallery/GalleryPreview";
import { EventHighlights } from "@/components/public/features/highlights/EventHighlights";
import { HowToJoin } from "@/components/public/features/highlights/HowToJoin";
import { RegistrationCTA } from "@/components/public/features/registration/RegistrationCTA";
import {
    getActiveYear,
    getRegistrationStatus,
    getFeaturedSectionTypeForActiveYear,
    getHomepageStepsForActiveYear,
} from "@/lib/services";

export default async function HomePage() {
    const [activeYear, regStatus, featuredSectionType, homepageSteps] =
        await Promise.all([
            getActiveYear(),
            getRegistrationStatus(),
            getFeaturedSectionTypeForActiveYear(),
            getHomepageStepsForActiveYear(),
        ]);

    const eventDate = formatEventDateRange(
        activeYear?.startDate,
        activeYear?.endDate
    );

    return (
        <>
            <HeroSection
                title={activeYear?.title || "HELMÁČ"}
                eventDate={eventDate ?? undefined}
                backgroundImage={storageUrl(activeYear?.heroPhoto) || undefined}
                subtitle={
                    activeYear?.subtitle ||
                    "Středověká fantasy LARP událost, kde se příběhy středověku mísí s magií a dobrodružstvím"
                }
                ctaText={regStatus.isOpen ? "Registrovat se" : undefined}
                ctaHref={regStatus.isOpen ? "/registrace" : undefined}
                secondaryCtaText="Více o programu"
                secondaryCtaHref="/program"
            >
                {!regStatus.isOpen && regStatus.registrationStartDate && (
                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: '"Lato", sans-serif',
                            fontWeight: 500,
                            color: "text.primary",
                        }}
                    >
                        Registrace se otevře{" "}
                        {formatDate(regStatus.registrationStartDate)}
                    </Typography>
                )}
            </HeroSection>

            <DecorativeDivider variant="ornate" sx={{ my: 0 }} />

            <Section>
                <SectionTitle
                    title="Novinky"
                    subtitle="Sleduj nejnovější zprávy a aktualizace"
                    icon="trumpet-flag"
                />
                <NewsPreview />
            </Section>

            <DecorativeDivider
                variant="ornate"
                sx={{ my: 0, transform: "translateY(50%)" }}
            />

            <Section
                backgroundColor="background.paper"
                animationDelay={100}
                sx={{ pb: { xs: 0, md: 0 } }}
            >
                <SectionTitle
                    title="Galerie"
                    subtitle="Nahlédni do světa Helmáče"
                    icon="wood-frame"
                />
                <GalleryPreview />
                <DecorativeDivider
                    variant="ornate"
                    sx={{
                        mt: { xs: 8 },
                        mb: 0,
                        transform: "translateY(50%)",
                    }}
                />
            </Section>

            {featuredSectionType && featuredSectionType.sections.length > 0 && (
                <>
                    <Section animationDelay={100}>
                        <SectionTitle
                            title={
                                featuredSectionType.pageTitle ||
                                featuredSectionType.label
                            }
                            subtitle={
                                featuredSectionType.description ||
                                featuredSectionType.pageSubtitle ||
                                undefined
                            }
                            icon={featuredSectionType.icon || "crossed-swords"}
                        />
                        <EventHighlights
                            sections={featuredSectionType.sections}
                            slug={featuredSectionType.slug}
                        />
                    </Section>

                    <DecorativeDivider
                        variant="ornate"
                        sx={{ my: 0, transform: "translateY(50%)" }}
                    />
                </>
            )}

            {homepageSteps.length > 0 && (
                <Section backgroundColor="background.paper" animationDelay={100}>
                    <SectionTitle
                        title="Jak se zúčastnit"
                        subtitle="Tři jednoduché kroky a můžeš být u toho"
                        icon="journey"
                    />
                    <HowToJoin steps={homepageSteps} />
                </Section>
            )}

            <Box
                sx={{
                    background:
                        "linear-gradient(135deg, #9A7B1A 0%, #C9A227 30%, #E5C158 50%, #C9A227 70%, #9A7B1A 100%)",
                    position: "relative",
                }}
            >
                <RegistrationCTA />
            </Box>
            <DecorativeDivider variant="ornate" />
        </>
    );
}
