export type MedievalPalette = {
    background: {
        default: string;
        paper: string;
        surface: string;
        input: string;
    };
    gold: { main: string; light: string; dark: string; contrastText: string };
    text: { primary: string; secondary: string; muted: string };
    accent: { green: string; red: string };
    divider: string;
};

export const darkPalette: MedievalPalette = {
    background: {
        default: "#0D0D0D",
        paper: "#101010",
        surface: "#1A1A1A",
        input: "#2A2A2A",
    },
    gold: {
        main: "#C9A227",
        light: "#E5C158",
        dark: "#9A7B1A",
        contrastText: "#0D0D0D",
    },
    text: {
        primary: "#FFFFFF",
        secondary: "#B0B0B0",
        muted: "#6B6B6B",
    },
    accent: {
        green: "#4A7C59",
        red: "#8B3A3A",
    },
    divider: "rgba(107, 107, 107, 0.2)",
};

export const lightPalette: MedievalPalette = {
    background: {
        default: "#F5F2EB",
        paper: "#EAE6DD",
        surface: "#EAE6DD",
        input: "#DED9CE",
    },
    gold: {
        main: "#C9A227",
        light: "#E5C158",
        dark: "#9A7B1A",
        contrastText: "#0D0D0D",
    },
    text: {
        primary: "#0D0A26",
        secondary: "#5C5650",
        muted: "#8A847A",
    },
    accent: {
        green: "#4A7C59",
        red: "#8B3A3A",
    },
    divider: "rgba(45, 42, 38, 0.15)",
};

// Admin Color Palette
export const adminColors = {
    primary: {
        main: "#1976d2",
        light: "#42a5f5",
        dark: "#1565c0",
    },
    secondary: {
        main: "#9c27b0",
        light: "#ba68c8",
        dark: "#7b1fa2",
    },
    background: {
        default: "#f8fafc",
        paper: "#ffffff",
    },
};
