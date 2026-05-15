import { Box, Grid, Typography } from "@mui/material";
import { GameIcon } from "@/lib/icons";
import { type ReactNode } from "react";

interface AccountStatTileProps {
    icon: string;
    label: ReactNode;
    value?: ReactNode;
    href?: string;
    disabled?: boolean;
    highlighted?: boolean;
}

export function AccountStatTile({
    icon,
    label,
    value,
    href,
    disabled,
    highlighted,
}: AccountStatTileProps) {
    return (
        <Grid item md={2} xs={4}>
            <Box
                {...(href && !disabled ? { component: "a", href } : {})}
                sx={{
                    display: "block",
                    textAlign: "center",
                    textDecoration: "none",
                    color: "inherit",
                    px: { xs: 1.5, md: 3 },
                    py: { xs: 3, md: 4 },
                    borderRadius: 2,
                    ...(disabled
                        ? { opacity: 0.4, cursor: "default" }
                        : {
                              transition: "all 0.3s ease",
                              "&:hover": {
                                  backgroundColor: "rgba(201, 162, 39, 0.04)",
                                  "& .stat-icon": {
                                      backgroundColor:
                                          "rgba(201, 162, 39, 0.12)",
                                      borderColor: "primary.main",
                                  },
                              },
                          }),
                }}
            >
                <Box
                    className="stat-icon"
                    sx={{
                        width: 72,
                        height: 72,
                        mx: "auto",
                        mb: 2.5,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: highlighted ? "primary.dark" : "divider",
                        backgroundColor: highlighted
                            ? "rgba(201, 162, 39, 0.06)"
                            : "rgba(201, 162, 39, 0.03)",
                        transition: "all 0.3s ease",
                    }}
                >
                    <GameIcon
                        name={icon}
                        sx={{
                            fontSize: "2rem",
                            color: highlighted
                                ? "primary.main"
                                : "text.secondary",
                        }}
                    />
                </Box>
                {value !== undefined ? (
                    <>
                        <Typography
                            variant="h4"
                            component="p"
                            sx={{
                                mb: 0.5,
                                color: highlighted
                                    ? "primary.main"
                                    : "text.primary",
                            }}
                        >
                            {value}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                lineHeight: 1.7,
                                opacity: highlighted ? 1 : 0.7,
                                ...(highlighted && {
                                    color: "primary.main",
                                }),
                            }}
                        >
                            {label}
                        </Typography>
                    </>
                ) : (
                    <>
                        <Typography
                            variant="body1"
                            component="p"
                            sx={{ mb: 0.5, fontWeight: 500 }}
                        >
                            Již brzy
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{ lineHeight: 1.7, opacity: 0.7 }}
                        >
                            {label}
                        </Typography>
                    </>
                )}
            </Box>
        </Grid>
    );
}
