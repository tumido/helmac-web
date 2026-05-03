"use client";

import Link from "next/link";
import {
    Box,
    Container,
    Typography,
    Link as MuiLink,
    Divider,
} from "@mui/material";
import { NAV_LINKS } from "@/lib/navigation";
import dayjs from "dayjs";
import "dayjs/locale/cs";

dayjs.locale("cs");

export interface FooterDates {
    startDate: string | null;
    endDate: string | null;
}

interface FooterProps {
    dates?: FooterDates | null;
}

const LEGAL_LINKS = [{ label: "Ochrana osobních údajů", href: "/gdpr" }];

function formatDateRange(
    startDate: string | null,
    endDate: string | null
): string | null {
    if (!startDate) return null;
    const start = dayjs(startDate);
    if (!endDate) {
        return start.format("D. MMMM YYYY");
    }
    const end = dayjs(endDate);
    if (start.month() === end.month()) {
        return `${start.format("D.")}–${end.format("D. MMMM YYYY")}`;
    }
    return `${start.format("D. MMMM")} – ${end.format("D. MMMM YYYY")}`;
}

export function Footer({ dates }: FooterProps) {
    const currentYear = new Date().getFullYear();
    const dateRange = dates
        ? formatDateRange(dates.startDate, dates.endDate)
        : null;

    return (
        <Box
            component="footer"
            sx={{
                borderTop: 1,
                borderColor: "divider",
                mt: 8,
            }}
        >
            <Container maxWidth="lg">
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        justifyContent: "space-between",
                        gap: { xs: 4 },
                        py: 4,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexShrink: 0,
                        }}
                    >
                        <Box
                            component="img"
                            src="/images/helmac-logo-centered.svg"
                            alt="HELMAC"
                            sx={{
                                width: 36,
                                height: 50,
                            }}
                        />
                        <Box>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontFamily: '"Cinzel", serif',
                                    fontWeight: 600,
                                    color: "text.primary",
                                    letterSpacing: "0.05em",
                                    mb: 0.5,
                                }}
                            >
                                HELMÁČ
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: "text.secondary",
                                }}
                            >
                                Fantasy LARP
                            </Typography>
                            {dateRange && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: "block",
                                        color: "text.secondary",
                                        mt: 0.5,
                                    }}
                                >
                                    {dateRange}
                                </Typography>
                            )}
                        </Box>
                    </Box>

                    <Box
                        component="nav"
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: { xs: 1.5, sm: 2.5 },
                            alignItems: "flex-start",
                        }}
                    >
                        {NAV_LINKS.map((link) => (
                            <MuiLink
                                key={link.href}
                                component={Link}
                                href={link.href}
                                underline="none"
                                variant="caption"
                                sx={{
                                    color: "text.secondary",
                                    "&:hover": {
                                        color: "primary.main",
                                    },
                                }}
                            >
                                {link.label}
                            </MuiLink>
                        ))}
                    </Box>
                </Box>

                <Divider />

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                        justifyContent: "space-between",
                        alignItems: {
                            xs: "flex-start",
                            sm: "center",
                        },
                        gap: 1,
                        py: 2,
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            color: "text.secondary",
                            opacity: 0.6,
                        }}
                    >
                        {`© ${currentYear} HELMAC`}
                    </Typography>
                    <Box
                        sx={{
                            display: "flex",
                            gap: 2,
                        }}
                    >
                        {LEGAL_LINKS.map((link) => (
                            <MuiLink
                                key={link.href}
                                component={Link}
                                href={link.href}
                                underline="none"
                                variant="caption"
                                sx={{
                                    color: "text.secondary",
                                    opacity: 0.6,
                                    "&:hover": {
                                        opacity: 1,
                                        color: "primary.main",
                                    },
                                }}
                            >
                                {link.label}
                            </MuiLink>
                        ))}
                    </Box>
                </Box>
            </Container>
        </Box>
    );
}
