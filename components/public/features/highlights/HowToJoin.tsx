import { Box, Grid, Typography } from "@mui/material";
import { AnimatedSection } from "@/components/public/ui/AnimatedSection";
import { GameIcon } from "@/lib/icons";

interface HomepageStep {
    title: string;
    description: string;
    icon: string;
}

interface HowToJoinProps {
    steps: HomepageStep[];
}

function StepCard({
    number,
    icon,
    title,
    description,
}: {
    number: number;
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <Box
            sx={{
                textAlign: "center",
                position: "relative",
                px: { xs: 2, md: 4 },
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                }}
            >
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: "primary.main",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "rgba(201, 162, 39, 0.08)",
                    }}
                >
                    <GameIcon
                        name={icon}
                        sx={{
                            fontSize: "2.2rem",
                            color: "primary.main",
                        }}
                    />
                </Box>
                <Typography
                    sx={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "primary.main",
                        color: "primary.contrastText",
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {number}
                </Typography>
            </Box>
            <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                {title}
            </Typography>
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    lineHeight: 1.7,
                    maxWidth: 300,
                    mx: "auto",
                }}
            >
                {description}
            </Typography>
        </Box>
    );
}

export function HowToJoin({ steps }: HowToJoinProps) {
    return (
        <Grid
            container
            spacing={{ xs: 6, md: 4 }}
            justifyContent="center"
            alignItems="flex-start"
        >
            {steps.map((step, index) => (
                <Grid
                    item
                    key={index}
                    xs={12}
                    sm={4}
                    sx={{
                        position: "relative",
                    }}
                >
                    <AnimatedSection delay={index * 150}>
                        <StepCard
                            number={index + 1}
                            icon={step.icon}
                            title={step.title}
                            description={step.description}
                        />
                    </AnimatedSection>
                    {index < steps.length - 1 && (
                        <Box
                            sx={{
                                display: { xs: "none", sm: "block" },
                                position: "absolute",
                                top: 40,
                                right: -12,
                                color: "primary.dark",
                                opacity: 0.4,
                                fontSize: "1.5rem",
                                fontFamily: '"Cinzel", serif',
                            }}
                        >
                            ›
                        </Box>
                    )}
                </Grid>
            ))}
        </Grid>
    );
}
