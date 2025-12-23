"use client";

import { createTheme } from "@mui/material/styles";
import { csCZ } from "@mui/material/locale";
import { adminColors } from "./colors";

export const adminTheme = createTheme(
    {
        palette: {
            mode: "light",
            primary: adminColors.primary,
            secondary: adminColors.secondary,
            background: adminColors.background,
        },
        typography: {
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            h1: {
                fontSize: "2.5rem",
                fontWeight: 700,
            },
            h2: {
                fontSize: "2rem",
                fontWeight: 600,
            },
            h3: {
                fontSize: "1.5rem",
                fontWeight: 600,
            },
            h4: {
                fontSize: "1.25rem",
                fontWeight: 600,
            },
            h5: {
                fontSize: "1.1rem",
                fontWeight: 600,
            },
            h6: {
                fontSize: "1rem",
                fontWeight: 600,
            },
        },
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: "none",
                        borderRadius: 8,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                    },
                },
            },
            MuiTextField: {
                defaultProps: {
                    variant: "outlined",
                    size: "small",
                },
            },
        },
    },
    csCZ
);
