import { Box, Container, ContainerProps } from "@mui/material";
import { ReactNode } from "react";
import { AnimatedSection } from "./AnimatedSection";

interface SectionProps {
    children: ReactNode;
    maxWidth?: ContainerProps["maxWidth"];
    py?: number | { xs?: number; sm?: number; md?: number };
    backgroundColor?: string;
    id?: string;
    disableAnimation?: boolean;
    animationDelay?: number;
}

export function Section({
    children,
    maxWidth = "lg",
    py = { xs: 6, md: 10 },
    backgroundColor,
    id,
    disableAnimation,
    animationDelay,
}: SectionProps) {
    return (
        <Box
            component="section"
            id={id}
            sx={{
                py,
                backgroundColor,
            }}
        >
            <Container maxWidth={maxWidth}>
                <AnimatedSection
                    disableAnimation={disableAnimation}
                    delay={animationDelay}
                >
                    {children}
                </AnimatedSection>
            </Container>
        </Box>
    );
}
