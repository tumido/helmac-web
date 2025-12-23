import { Box, Container, ContainerProps } from "@mui/material";
import { ReactNode } from "react";

interface SectionProps {
    children: ReactNode;
    maxWidth?: ContainerProps["maxWidth"];
    py?: number | { xs?: number; sm?: number; md?: number };
    backgroundColor?: string;
    id?: string;
}

export function Section({
    children,
    maxWidth = "lg",
    py = { xs: 6, md: 10 },
    backgroundColor,
    id,
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
            <Container maxWidth={maxWidth}>{children}</Container>
        </Box>
    );
}
