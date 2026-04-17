"use client";

import { createTheme } from "@mui/material/styles";
import { csCZ } from "@mui/material/locale";
import { medievalLightColors } from "./colors";

export const publicLightTheme = createTheme(
    {
        breakpoints: {
            values: { xs: 0, sm: 600, md: 900, lg: 1400, xl: 1536 },
        },
        palette: {
            mode: "light",
            primary: {
                main: medievalLightColors.gold.main,
                light: medievalLightColors.gold.light,
                dark: medievalLightColors.gold.dark,
                contrastText: medievalLightColors.gold.contrastText,
            },
            secondary: {
                main: medievalLightColors.gold.main,
                light: medievalLightColors.gold.light,
                dark: medievalLightColors.gold.dark,
                contrastText: medievalLightColors.gold.contrastText,
            },
            background: {
                default: medievalLightColors.background.default,
                paper: medievalLightColors.background.paper,
            },
            text: {
                primary: medievalLightColors.text.primary,
                secondary: medievalLightColors.text.secondary,
            },
            divider: medievalLightColors.divider,
            error: {
                main: medievalLightColors.accent.red,
            },
            success: {
                main: medievalLightColors.accent.green,
            },
        },
        typography: {
            fontFamily: '"Merriweather", "Georgia", serif',
            h1: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 700,
                fontSize: "2.5rem",
                color: medievalLightColors.gold.dark,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
            },
            h2: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: "2rem",
                color: medievalLightColors.gold.dark,
                letterSpacing: "0.03em",
            },
            h3: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: "1.5rem",
                color: medievalLightColors.gold.dark,
            },
            h4: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: "1.25rem",
                color: medievalLightColors.gold.dark,
            },
            h5: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: "1.1rem",
            },
            h6: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: "1rem",
            },
            body1: {
                fontSize: "0.85rem",
                lineHeight: 1.7,
                color: medievalLightColors.text.primary,
            },
            body2: {
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: medievalLightColors.text.secondary,
            },
            button: {
                fontFamily: '"Cinzel", serif',
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
            },
            caption: {
                color: medievalLightColors.text.muted,
            },
        },
        shape: {
            borderRadius: 4,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: medievalLightColors.background.default,
                        color: medievalLightColors.text.primary,
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
                        backgroundColor: medievalLightColors.gold.main,
                        color: medievalLightColors.gold.contrastText,
                        boxShadow: "none",
                        "&:hover": {
                            backgroundColor: medievalLightColors.gold.dark,
                            boxShadow: "0 4px 12px rgba(201, 162, 39, 0.3)",
                        },
                    },
                    containedPrimary: {
                        backgroundColor: medievalLightColors.gold.main,
                        "&:hover": {
                            backgroundColor: medievalLightColors.gold.dark,
                        },
                    },
                    containedSecondary: {
                        backgroundColor: medievalLightColors.gold.main,
                        color: medievalLightColors.gold.contrastText,
                        "&:hover": {
                            backgroundColor: medievalLightColors.gold.dark,
                        },
                    },
                    outlined: {
                        borderWidth: 2,
                        borderColor: medievalLightColors.gold.main,
                        color: medievalLightColors.gold.dark,
                        "&:hover": {
                            borderWidth: 2,
                            backgroundColor: `${medievalLightColors.gold.main}15`,
                            borderColor: medievalLightColors.gold.dark,
                        },
                    },
                    text: {
                        color: medievalLightColors.gold.dark,
                        "&:hover": {
                            backgroundColor: `${medievalLightColors.gold.main}15`,
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        border: `1px solid ${medievalLightColors.text.muted}33`,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                        backgroundColor: medievalLightColors.background.paper,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: medievalLightColors.background.paper,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        color: medievalLightColors.text.primary,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: medievalLightColors.background.paper,
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
                            backgroundColor: medievalLightColors.background.dark,
                            borderRadius: 4,
                            "& fieldset": {
                                borderColor: `${medievalLightColors.text.muted}66`,
                                borderWidth: 1,
                            },
                            "&:hover fieldset": {
                                borderColor: medievalLightColors.text.secondary,
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: medievalLightColors.gold.main,
                                borderWidth: 2,
                            },
                        },
                        "& .MuiInputLabel-root": {
                            color: medievalLightColors.text.secondary,
                        },
                        "& .MuiInputBase-input": {
                            color: medievalLightColors.text.primary,
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
                        backgroundColor: `${medievalLightColors.gold.main}22`,
                        color: medievalLightColors.gold.dark,
                    },
                    outlined: {
                        borderColor: medievalLightColors.gold.main,
                        color: medievalLightColors.gold.dark,
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: medievalLightColors.divider,
                    },
                },
            },
            MuiLink: {
                styleOverrides: {
                    root: {
                        color: medievalLightColors.gold.dark,
                        textDecorationColor: `${medievalLightColors.gold.main}66`,
                        "&:hover": {
                            color: medievalLightColors.gold.main,
                            textDecorationColor: medievalLightColors.gold.main,
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundColor: medievalLightColors.background.paper,
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        "&:hover": {
                            backgroundColor: `${medievalLightColors.gold.main}15`,
                        },
                        "&.Mui-selected": {
                            backgroundColor: `${medievalLightColors.gold.main}20`,
                            "&:hover": {
                                backgroundColor: `${medievalLightColors.gold.main}25`,
                            },
                        },
                    },
                },
            },
            MuiSelect: {
                styleOverrides: {
                    root: {
                        backgroundColor: medievalLightColors.background.dark,
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    root: {
                        "& .MuiTab-root": {
                            color: medievalLightColors.text.secondary,
                        },
                        "& .Mui-selected": {
                            color: medievalLightColors.gold.dark,
                        },
                    },
                },
            },
        },
    },
    csCZ
);
