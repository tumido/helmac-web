"use client";

import {
    Box,
    Card as MuiCard,
    CardContent,
    CardMedia,
    CardProps,
} from "@mui/material";
import { ReactNode } from "react";
import { OrnamentalUnderline } from "./OrnamentalUnderline";
import { grainyMaskHorizontal } from "@/lib/utils/grainy-mask";

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
    imageHeight = 140,
    sx,
    ...props
}: ContentCardProps) {
    return (
        <Box sx={{ position: "relative", height: "100%", mx: 2, "&:hover img": { filter: "none" } }}>
            <OrnamentalUnderline
                sx={{
                    position: "absolute",
                    top: 0,
                    left: -1,
                    right: -1,
                    mt: 0,
                    mx: 0,
                    zIndex: 1,
                }}
            />
            <MuiCard
                elevation={0}
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 0,
                    backgroundColor: "rgba(128, 128, 128, 0.08)",
                    backgroundImage: "none",
                    ...sx,
                }}
                {...props}
            >
                {image && (
                    <CardMedia
                        component="img"
                        image={image}
                        alt={imageAlt}
                        sx={{
                            height: imageHeight,
                            objectFit: "cover",
                            ...grainyMaskHorizontal,
                            filter: "grayscale(0.3) sepia(0.15) saturate(1.1) brightness(0.9)",
                            transition: "filter 0.4s ease",
                        }}
                    />
                )}
                <CardContent
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    {children}
                </CardContent>
            </MuiCard>
            <OrnamentalUnderline
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: -1,
                    right: -1,
                    mt: 0,
                    mx: 0,
                    transform: "scaleY(-1)",
                }}
            />
        </Box>
    );
}
