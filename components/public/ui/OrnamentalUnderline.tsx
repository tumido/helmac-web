import { Box, type SxProps, type Theme } from "@mui/material";

const CURL_WIDTH = 20;
const CURL_HEIGHT = 8;

function CurlSvg() {
    return (
        <svg
            viewBox="0 0 56 20"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                width: CURL_WIDTH,
                height: CURL_HEIGHT,
                display: "block",
            }}
        >
            <path
                d="M27.80,17.20C27.79,6.42 24.52,1.30 0.80,0.98L16.63,0.91C46.45,0.36 54.67,8.56 54.80,19.20"
                strokeWidth="3.8"
            />
        </svg>
    );
}

interface OrnamentalUnderlineProps {
    sx?: SxProps<Theme>;
}

export function OrnamentalUnderline({ sx }: OrnamentalUnderlineProps) {
    return (
        <Box
            component="span"
            sx={{
                display: "block",
                position: "relative",
                color: "primary.main",
                height: CURL_HEIGHT,
                mt: 1,
                mx: 1,
                ...((typeof sx === "object" && sx !== null
                    ? sx
                    : {}) as object),
            }}
        >
            <Box
                component="span"
                sx={{
                    position: "absolute",
                    left: -CURL_WIDTH + 4,
                    top: 0,
                    transform: "scaleX(-1)",
                }}
            >
                <CurlSvg />
            </Box>
            <Box
                component="span"
                sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    borderTop: "1.5px solid currentColor",
                }}
            />
            <Box
                component="span"
                sx={{
                    position: "absolute",
                    right: -CURL_WIDTH + 4,
                    top: 0,
                }}
            >
                <CurlSvg />
            </Box>
        </Box>
    );
}
