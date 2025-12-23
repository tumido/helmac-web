import { Card as MuiCard, CardContent, CardMedia, CardProps } from "@mui/material";
import { ReactNode } from "react";

interface ContentCardProps extends Omit<CardProps, "children"> {
    children: ReactNode;
    image?: string;
    imageAlt?: string;
    imageHeight?: number;
}

export function Card({
    children,
    image,
    imageAlt = "",
    imageHeight = 200,
    sx,
    ...props
}: ContentCardProps) {
    return (
        <MuiCard
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 8px 24px rgba(201, 162, 39, 0.15)",
                },
                ...sx,
            }}
            {...props}
        >
            {image && (
                <CardMedia
                    component="img"
                    height={imageHeight}
                    image={image}
                    alt={imageAlt}
                    sx={{ objectFit: "cover" }}
                />
            )}
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {children}
            </CardContent>
        </MuiCard>
    );
}
