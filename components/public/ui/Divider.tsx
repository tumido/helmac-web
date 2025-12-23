import { Box } from "@mui/material";

interface DecorativeDividerProps {
    variant?: "simple" | "ornate";
    color?: "primary" | "secondary";
    my?: number;
}

export function DecorativeDivider({
    variant = "simple",
    color = "secondary",
    my = 4,
}: DecorativeDividerProps) {
    if (variant === "ornate") {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    my,
                    gap: 2,
                }}
            >
                <Box
                    sx={{
                        width: 60,
                        height: 1,
                        backgroundColor: `${color}.main`,
                        opacity: 0.5,
                    }}
                />
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        backgroundColor: `${color}.main`,
                        transform: "rotate(45deg)",
                    }}
                />
                <Box
                    sx={{
                        width: 60,
                        height: 1,
                        backgroundColor: `${color}.main`,
                        opacity: 0.5,
                    }}
                />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                width: 80,
                height: 3,
                backgroundColor: `${color}.main`,
                mx: "auto",
                my,
            }}
        />
    );
}
