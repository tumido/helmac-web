import { Box, Typography } from "@mui/material";

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    align?: "left" | "center" | "right";
}

export function SectionTitle({
    title,
    subtitle,
    align = "center",
}: SectionTitleProps) {
    return (
        <Box
            sx={{
                textAlign: align,
                mb: { xs: 4, md: 6 },
            }}
        >
            <Typography
                variant="h2"
                component="h2"
                sx={{
                    position: "relative",
                    display: "inline-block",
                    pb: 2,
                    "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: align === "center" ? "50%" : 0,
                        transform:
                            align === "center" ? "translateX(-50%)" : "none",
                        width: 80,
                        height: 3,
                        backgroundColor: "secondary.main",
                    },
                }}
            >
                {title}
            </Typography>
            {subtitle && (
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 2, maxWidth: 600, mx: align === "center" ? "auto" : 0 }}
                >
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
}
