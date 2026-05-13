import { Box, SxProps } from "@mui/material";

interface DecorativeDividerProps {
    variant?: "simple" | "simple-reversed" | "ornate";
    color?: "primary" | "secondary";
    sx?: SxProps;
}

function DividerSvg() {
    return (
        <svg
            viewBox="0 0 736 173"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "100%", maxWidth: 260, height: "auto" }}
        >
            {/* Center ornament */}
            <path
                d="M373.06,121.28C371.45,98.62 359.90,86.91 338.17,86.39C361.46,84.38 372.29,72.16 372.97,51.60C373.30,73.18 385.13,84.63 407.85,86.48C382.86,88.36 372.55,100.90 373.06,121.28Z"
                strokeWidth="3.6"
            />
            {/* Top petal */}
            <path
                d="M365.40,74.46C355.88,50.36 356.91,25.87 373.01,0.80C385.66,25.20 387.92,49.71 380.13,74.31"
                strokeWidth="3.8"
            />
            {/* Left petal */}
            <path
                d="M362.20,94.70C351.51,100.35 341.67,100.53 325.23,94.70C318.51,92.32 313.87,89.90 301.94,86.44C311.97,83.78 319.85,81.10 326.25,78.65C343.69,71.98 352.15,72.99 362.09,78.29"
                strokeWidth="3.8"
            />
            {/* Right petal */}
            <path
                d="M384.08,94.64C394.77,100.29 404.61,100.47 421.05,94.64C427.77,92.26 432.41,89.84 444.34,86.38C434.31,83.72 426.43,81.04 420.03,78.59C402.59,71.92 394.13,72.93 384.19,78.23"
                strokeWidth="3.8"
            />
            {/* Bottom petal */}
            <path
                d="M361.91,94.76C357.93,118.25 363.44,145.95 371.79,171.86C380.18,146.18 386.67,118.06 383.04,94.70"
                strokeWidth="3.8"
            />
            {/* Left upper line + curl */}
            <path d="M267.80,58.59L44.80,58.59" strokeWidth="3.8" />
            <path
                d="M294.80,42.28C294.79,53.06 291.52,58.19 267.80,58.50L283.63,58.57C313.45,59.12 321.68,50.92 321.80,40.28"
                strokeWidth="3.8"
            />
            {/* Left lower line + curl */}
            <path d="M267.80,114.28L44.80,114.28" strokeWidth="3.8" />
            <path
                d="M294.80,130.59C294.79,119.81 291.52,114.68 267.80,114.37L283.63,114.30C313.45,113.75 321.68,121.95 321.80,132.59"
                strokeWidth="3.8"
            />
            {/* Left center line */}
            <path d="M272.80,86.44L0.80,86.44" strokeWidth="3.8" />
            {/* Right upper line + curl */}
            <path d="M467.69,58.59L690.69,58.59" strokeWidth="3.8" />
            <path
                d="M440.69,42.28C440.70,53.06 443.97,58.19 467.69,58.50L451.86,58.57C422.04,59.12 413.81,50.92 413.69,40.28"
                strokeWidth="3.8"
            />
            {/* Right lower line + curl */}
            <path d="M467.69,114.28L690.69,114.28" strokeWidth="3.8" />
            <path
                d="M440.69,130.59C440.70,119.81 443.97,114.68 467.69,114.37L451.86,114.30C422.04,113.75 413.81,121.95 413.69,132.59"
                strokeWidth="3.8"
            />
            {/* Right center line */}
            <path d="M462.69,86.44L734.69,86.44" strokeWidth="3.8" />
        </svg>
    );
}

function SimpleDividerSvg() {
    return (
        <svg
            viewBox="0 0 333 20"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "100%", maxWidth: 130, height: "auto" }}
        >
            <path d="M277.80,19.11L54.80,19.11" strokeWidth="3.8" />
            <path
                d="M304.80,2.80C304.79,13.58 301.52,18.70 277.80,19.02L293.63,19.09C323.45,19.64 331.68,11.44 331.80,0.80"
                strokeWidth="3.8"
            />
            <path
                d="M27.80,2.80C27.81,13.58 31.08,18.70 54.80,19.02L38.97,19.09C9.15,19.64 0.92,11.44 0.80,0.80"
                strokeWidth="3.8"
            />
        </svg>
    );
}

function SimpleReversedDividerSvg() {
    return (
        <svg
            viewBox="0 0 333 20"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "100%", maxWidth: 130, height: "auto" }}
        >
            <path d="M277.80,0.89L54.80,0.89" strokeWidth="3.8" />
            <path
                d="M304.80,17.20C304.79,6.42 301.52,1.30 277.80,0.98L293.63,0.91C323.45,0.36 331.68,8.56 331.80,19.20"
                strokeWidth="3.8"
            />
            <path
                d="M27.80,17.20C27.81,6.42 31.08,1.30 54.80,0.98L38.97,0.91C9.15,0.36 0.92,8.56 0.80,19.20"
                strokeWidth="3.8"
            />
        </svg>
    );
}

export function DecorativeDivider({
    variant = "simple",
    color = "primary",
    sx = {},
}: DecorativeDividerProps) {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "center",
                color: `${color}.main`,
                my: 4,
                ...sx,
            }}
        >
            {variant === "ornate" ? (
                <DividerSvg />
            ) : variant === "simple-reversed" ? (
                <SimpleReversedDividerSvg />
            ) : (
                <SimpleDividerSvg />
            )}
        </Box>
    );
}
