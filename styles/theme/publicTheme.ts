"use client";

import { createTheme } from "@mui/material/styles";
import { csCZ } from "@mui/material/locale";
import { medievalColors } from "./colors";

export const publicTheme = createTheme(
    {
        palette: {
            mode: "dark",
            primary: {
                main: medievalColors.gold.main,
                light: medievalColors.gold.light,
                dark: medievalColors.gold.dark,
                contrastText: medievalColors.gold.contrastText,
            },
            secondary: {
                main: medievalColors.gold.main,
                light: medievalColors.gold.light,
                dark: medievalColors.gold.dark,
                contrastText: medievalColors.gold.contrastText,
            },
            background: {
                default: medievalColors.dark.dark,
                paper: medievalColors.dark.paper,
            },
            text: {
                primary: medievalColors.text.primary,
                secondary: medievalColors.text.secondary,
            },
            divider: `${medievalColors.text.muted}33`,
            error: {
                main: medievalColors.accent.red,
            },
            success: {
                main: medievalColors.accent.green,
            },
        },
        typography: {
            fontFamily: '"Merriweather", "Georgia", serif',
            h1: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 700,
                fontSize: "2.5rem",
                color: medievalColors.gold.main,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
            },
            h2: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: "2rem",
                color: medievalColors.gold.main,
                letterSpacing: "0.03em",
            },
            h3: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: "1.5rem",
                color: medievalColors.gold.main,
            },
            h4: {
                fontFamily: '"Cinzel", "Times New Roman", serif',
                fontWeight: 600,
                fontSize: "1.25rem",
                color: medievalColors.gold.main,
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
                fontSize: "1rem",
                lineHeight: 1.7,
                color: medievalColors.text.primary,
            },
            body2: {
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: medievalColors.text.secondary,
            },
            button: {
                fontFamily: '"Cinzel", serif',
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
            },
            caption: {
                color: medievalColors.text.muted,
            },
        },
        shape: {
            borderRadius: 4,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        backgroundColor: medievalColors.dark.dark,
                        color: medievalColors.text.primary,
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
                        backgroundColor: medievalColors.gold.main,
                        color: medievalColors.gold.contrastText,
                        boxShadow: "none",
                        "&:hover": {
                            backgroundColor: medievalColors.gold.dark,
                            boxShadow: "0 4px 12px rgba(201, 162, 39, 0.3)",
                        },
                    },
                    containedPrimary: {
                        backgroundColor: medievalColors.gold.main,
                        "&:hover": {
                            backgroundColor: medievalColors.gold.dark,
                        },
                    },
                    containedSecondary: {
                        backgroundColor: medievalColors.gold.main,
                        color: medievalColors.gold.contrastText,
                        "&:hover": {
                            backgroundColor: medievalColors.gold.dark,
                        },
                    },
                    outlined: {
                        borderWidth: 2,
                        borderColor: medievalColors.gold.main,
                        color: medievalColors.gold.main,
                        "&:hover": {
                            borderWidth: 2,
                            backgroundColor: `${medievalColors.gold.main}15`,
                            borderColor: medievalColors.gold.light,
                        },
                    },
                    text: {
                        color: medievalColors.gold.main,
                        "&:hover": {
                            backgroundColor: `${medievalColors.gold.main}10`,
                        },
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 8,
                        border: `1px solid ${medievalColors.text.muted}22`,
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                        backgroundColor: medievalColors.dark.paper,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundColor: medievalColors.dark.main,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: medievalColors.dark.main,
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
                            backgroundColor: medievalColors.dark.light,
                            borderRadius: 4,
                            "& fieldset": {
                                borderColor: `${medievalColors.text.muted}44`,
                                borderWidth: 1,
                            },
                            "&:hover fieldset": {
                                borderColor: medievalColors.text.secondary,
                            },
                            "&.Mui-focused fieldset": {
                                borderColor: medievalColors.gold.main,
                                borderWidth: 2,
                            },
                        },
                        "& .MuiInputLabel-root": {
                            color: medievalColors.text.secondary,
                        },
                        "& .MuiInputBase-input": {
                            color: medievalColors.text.primary,
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
                        backgroundColor: `${medievalColors.gold.main}22`,
                        color: medievalColors.gold.main,
                    },
                    outlined: {
                        borderColor: medievalColors.gold.main,
                        color: medievalColors.gold.main,
                    },
                },
            },
            MuiDivider: {
                styleOverrides: {
                    root: {
                        borderColor: `${medievalColors.text.muted}33`,
                    },
                },
            },
            MuiLink: {
                styleOverrides: {
                    root: {
                        color: medievalColors.gold.main,
                        textDecorationColor: `${medievalColors.gold.main}44`,
                        "&:hover": {
                            color: medievalColors.gold.light,
                            textDecorationColor: medievalColors.gold.main,
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundColor: medievalColors.dark.paper,
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        "&:hover": {
                            backgroundColor: `${medievalColors.gold.main}10`,
                        },
                        "&.Mui-selected": {
                            backgroundColor: `${medievalColors.gold.main}15`,
                            "&:hover": {
                                backgroundColor: `${medievalColors.gold.main}20`,
                            },
                        },
                    },
                },
            },
            MuiSelect: {
                styleOverrides: {
                    root: {
                        backgroundColor: medievalColors.dark.light,
                    },
                },
            },
        },
    },
    csCZ
);
