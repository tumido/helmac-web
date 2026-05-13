import { Box, Container, ContainerProps, SxProps } from "@mui/material";
import { ReactNode } from "react";
import { AnimatedSection } from "./AnimatedSection";

interface SectionProps {
    children: ReactNode;
    maxWidth?: ContainerProps["maxWidth"];
    backgroundColor?: string;
    id?: string;
    disableAnimation?: boolean;
    animationDelay?: number;
    sx?: SxProps;
}

export function Section({
    children,
    maxWidth = "lg",
    backgroundColor,
    id,
    disableAnimation,
    animationDelay,
    sx,
}: SectionProps) {
    return (
        <Box
            component="section"
            id={id}
            sx={{
                py: { xs: 8, md: 14 },
                backgroundColor,
                ...sx,
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
