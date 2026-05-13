import { Box, Typography } from "@mui/material";
import { OrnamentalUnderline } from "./OrnamentalUnderline";
import { GameIcon } from "@/lib/icons";

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    align?: "left" | "center" | "right";
    icon?: string;
}

export function SectionTitle({
    title,
    subtitle,
    align = "center",
    icon,
}: SectionTitleProps) {
    return (
        <Box
            sx={{
                textAlign: align,
                mb: { xs: 4, md: 6 },
            }}
        >
            <Box
                sx={{
                    display: "inline-block",
                }}
            >
                <Box
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    {icon && (
                        <GameIcon
                            name={icon}
                            sx={{
                                fontSize: "2.4rem",
                                color: "primary.main",
                            }}
                        />
                    )}
                    <Typography variant="h2" component="h2">
                        {title}
                    </Typography>
                </Box>
                <OrnamentalUnderline />
            </Box>
            {subtitle && (
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        mt: 2,
                        maxWidth: 600,
                        mx: align === "center" ? "auto" : 0,
                        fontStyle: "italic",
                        letterSpacing: "0.03em",
                    }}
                >
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
}
