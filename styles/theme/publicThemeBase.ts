"use client";

import { createTheme, alpha } from "@mui/material/styles";
import { csCZ } from "@mui/material/locale";
import { darkPalette, lightPalette, MedievalPalette } from "./colors";

declare module "@mui/material/styles" {
    interface TypeBackground {
        surface: string;
        input: string;
    }

    interface TypeText {
        muted: string;
    }
}

export function createPublicTheme(
    palette: MedievalPalette,
    mode: "dark" | "light"
) {
    const isDark = mode === "dark";
    const goldText = palette.gold.main;

    return createTheme(
        {
            breakpoints: {
                values: {
                    xs: 0,
                    sm: 600,
                    md: 900,
                    lg: 1400,
                    xl: 1536,
                },
            },
            palette: {
                mode,
                primary: palette.gold,
                background: {
                    default: palette.background.default,
                    paper: palette.background.paper,
                    surface: palette.background.surface,
                    input: palette.background.input,
                },
                text: {
                    primary: palette.text.primary,
                    secondary: palette.text.secondary,
                    muted: palette.text.muted,
                },
                divider: palette.divider,
                error: { main: palette.accent.red },
                success: { main: palette.accent.green },
            },
            typography: {
                fontFamily: '"Lato", "Helvetica", "Arial", sans-serif',
                h1: {
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    fontWeight: 700,
                    fontSize: "2.5rem",
                    lineHeight: 1.2,
                    color: goldText,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                },
                h2: {
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    fontWeight: 600,
                    fontSize: "2rem",
                    lineHeight: 1.25,
                    color: goldText,
                    letterSpacing: "0.03em",
                },
                h3: {
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    fontWeight: 600,
                    fontSize: "1.5rem",
                    lineHeight: 1.3,
                    color: goldText,
                    letterSpacing: "0.02em",
                },
                h4: {
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    fontWeight: 600,
                    fontSize: "1.25rem",
                    lineHeight: 1.35,
                    color: goldText,
                    letterSpacing: "0.01em",
                },
                h5: {
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    lineHeight: 1.4,
                    color: goldText,
                },
                h6: {
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    fontWeight: 600,
                    fontSize: "1rem",
                    lineHeight: 1.4,
                    color: goldText,
                },
                subtitle1: {
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    fontSize: "1rem",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: palette.text.primary,
                },
                subtitle2: {
                    fontFamily: '"Cinzel", "Times New Roman", serif',
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: palette.text.secondary,
                },
                body1: {
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: palette.text.primary,
                },
                body2: {
                    fontSize: "0.85rem",
                    lineHeight: 1.5,
                    color: palette.text.secondary,
                },
                button: {
                    fontFamily: '"Cinzel", serif',
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                },
                caption: {
                    fontSize: "0.75rem",
                    lineHeight: 1.5,
                    color: palette.text.muted,
                },
            },
            shape: {
                borderRadius: 4,
            },
            components: {
                MuiCssBaseline: {
                    styleOverrides: {
                        html: {
                            scrollBehavior: "smooth",
                        },
                        body: {
                            backgroundColor: palette.background.default,
                            color: palette.text.primary,
                        },
                    },
                },
                MuiButton: {
                    styleOverrides: {
                        root: {
                            borderRadius: 4,
                            textTransform: "uppercase",
                            fontWeight: 600,
                            padding: "10px 24px",
                            letterSpacing: "0.1em",
                        },
                        contained: {
                            backgroundColor: palette.gold.main,
                            color: palette.gold.contrastText,
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: palette.gold.dark,
                                boxShadow: `0 4px 12px ${alpha(palette.gold.main, 0.3)}`,
                            },
                        },
                        containedPrimary: {
                            backgroundColor: palette.gold.main,
                            "&:hover": {
                                backgroundColor: palette.gold.dark,
                            },
                        },
                        containedSecondary: {
                            backgroundColor: palette.background.default,
                            color: palette.text.primary,
                            "&:hover": {
                                backgroundColor: isDark
                                    ? palette.background.input
                                    : palette.background.paper,
                            },
                        },
                        outlined: {
                            borderWidth: 1,
                            borderColor: palette.gold.main,
                            color: "goldText",
                            "&:hover": {
                                borderWidth: 1,
                                backgroundColor: alpha(palette.gold.main, 0.08),
                                borderColor: isDark
                                    ? palette.gold.light
                                    : palette.gold.dark,
                            },
                        },
                        text: {
                            color: goldText,
                            "&:hover": {
                                backgroundColor: alpha(
                                    palette.gold.main,
                                    isDark ? 0.06 : 0.08
                                ),
                            },
                        },
                    },
                },
                MuiCard: {
                    styleOverrides: {
                        root: {
                            borderRadius: 8,
                            border: `1px solid ${alpha(palette.text.muted, isDark ? 0.13 : 0.2)}`,
                            boxShadow: `0 4px 20px ${alpha("#000", isDark ? 0.4 : 0.08)}`,
                            backgroundColor: palette.background.paper,
                        },
                    },
                },
                MuiAppBar: {
                    styleOverrides: {
                        root: {
                            backgroundColor: palette.background.surface,
                            color: palette.text.primary,
                            boxShadow: `0 2px 8px ${alpha("#000", isDark ? 0.5 : 0.1)}`,
                        },
                    },
                },
                MuiDrawer: {
                    styleOverrides: {
                        paper: {
                            backgroundColor: palette.background.surface,
                        },
                    },
                },
                MuiTextField: {
                    defaultProps: {
                        variant: "outlined",
                    },
                    styleOverrides: {
                        root: {
                            "& .MuiOutlinedInput-root": {
                                backgroundColor: palette.background.input,
                                borderRadius: 4,
                                "& fieldset": {
                                    borderColor: alpha(
                                        palette.text.muted,
                                        isDark ? 0.27 : 0.4
                                    ),
                                    borderWidth: 1,
                                },
                                "&:hover fieldset": {
                                    borderColor: palette.text.secondary,
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: palette.gold.main,
                                    borderWidth: 2,
                                },
                            },
                            "& .MuiInputLabel-root": {
                                color: palette.text.secondary,
                            },
                            "& .MuiInputBase-input": {
                                color: palette.text.primary,
                                "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus":
                                    {
                                        WebkitBoxShadow: `0 0 0 100px ${palette.background.input} inset`,
                                        WebkitTextFillColor:
                                            palette.text.primary,
                                        caretColor: palette.text.primary,
                                    },
                            },
                        },
                    },
                },
                MuiChip: {
                    styleOverrides: {
                        root: {
                            borderRadius: 4,
                        },
                        filled: {
                            backgroundColor: alpha(palette.gold.main, 0.13),
                            color: goldText,
                        },
                        outlined: {
                            borderColor: palette.gold.main,
                            color: goldText,
                        },
                    },
                },
                MuiDivider: {
                    styleOverrides: {
                        root: {
                            borderColor: palette.divider,
                        },
                    },
                },
                MuiLink: {
                    styleOverrides: {
                        root: {
                            color: goldText,
                            textDecorationColor: alpha(
                                palette.gold.main,
                                isDark ? 0.27 : 0.4
                            ),
                            "&:hover": {
                                color: isDark
                                    ? palette.gold.light
                                    : palette.gold.main,
                                textDecorationColor: palette.gold.main,
                            },
                        },
                    },
                },
                MuiPaper: {
                    styleOverrides: {
                        root: {
                            backgroundColor: palette.background.paper,
                        },
                    },
                },
                MuiListItemButton: {
                    styleOverrides: {
                        root: {
                            "&:hover": {
                                backgroundColor: alpha(
                                    palette.gold.main,
                                    isDark ? 0.06 : 0.08
                                ),
                            },
                            "&.Mui-selected": {
                                backgroundColor: alpha(
                                    palette.gold.main,
                                    isDark ? 0.08 : 0.12
                                ),
                                "&:hover": {
                                    backgroundColor: alpha(
                                        palette.gold.main,
                                        isDark ? 0.12 : 0.15
                                    ),
                                },
                            },
                        },
                    },
                },
                MuiSelect: {
                    styleOverrides: {
                        root: {
                            backgroundColor: palette.background.input,
                        },
                    },
                },
                MuiTabs: {
                    styleOverrides: {
                        root: {
                            "& .MuiTab-root": {
                                color: palette.text.secondary,
                            },
                            "& .Mui-selected": {
                                color: goldText,
                            },
                        },
                    },
                },
            },
        },
        csCZ
    );
}

export const publicTheme = createPublicTheme(darkPalette, "dark");
export const publicLightTheme = createPublicTheme(lightPalette, "light");
