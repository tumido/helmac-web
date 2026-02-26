"use client";

import { useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    IconButton,
    Box,
    Typography,
    ImageList,
    ImageListItem,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import {
    Close,
    ChevronLeft,
    ChevronRight,
    ZoomIn,
} from "@mui/icons-material";
import { AlbumImage } from "./gallery.types";

interface ImageLightboxProps {
    images: AlbumImage[];
}

export function ImageLightbox({ images }: ImageLightboxProps) {
    const theme = useTheme();
    const isXs = useMediaQuery(theme.breakpoints.down("sm"));
    const isSm = useMediaQuery(theme.breakpoints.between("sm", "md"));
    const cols = isXs ? 1 : isSm ? 2 : 3;

    const [open, setOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleOpen = useCallback((index: number) => {
        setCurrentIndex(index);
        setOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setOpen(false);
    }, []);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    }, [images.length]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    }, [images.length]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === "ArrowLeft") handlePrev();
            if (event.key === "ArrowRight") handleNext();
            if (event.key === "Escape") handleClose();
        },
        [handlePrev, handleNext, handleClose]
    );

    const currentImage = images[currentIndex];

    return (
        <>
            <ImageList variant="masonry" cols={cols} gap={16}>
                {images.map((image, index) => (
                    <ImageListItem
                        key={image.id}
                        sx={{
                            cursor: "pointer",
                            overflow: "hidden",
                            borderRadius: 1,
                            "&:hover": {
                                "& img": {
                                    transform: "scale(1.05)",
                                },
                                "& .overlay": {
                                    opacity: 1,
                                },
                            },
                        }}
                        onClick={() => handleOpen(index)}
                    >
                        <Box sx={{ position: "relative" }}>
                            <Box
                                component="img"
                                src={image.thumbnailUrl || image.url}
                                alt={image.altText || image.title || ""}
                                loading="lazy"
                                sx={{
                                    width: "100%",
                                    display: "block",
                                    transition: "transform 0.3s ease",
                                }}
                            />
                            <Box
                                className="overlay"
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    backgroundColor: "rgba(0,0,0,0.3)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: 0,
                                    transition: "opacity 0.3s ease",
                                }}
                            >
                                <ZoomIn
                                    sx={{ color: "white", fontSize: 40 }}
                                />
                            </Box>
                        </Box>
                    </ImageListItem>
                ))}
            </ImageList>

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth={false}
                onKeyDown={handleKeyDown}
                PaperProps={{
                    sx: {
                        backgroundColor: "rgba(0,0,0,0.95)",
                        m: 0,
                        maxHeight: "100vh",
                        maxWidth: "100vw",
                    },
                }}
            >
                <DialogContent
                    sx={{
                        p: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        minHeight: { xs: "60vh", sm: "80vh" },
                        minWidth: { xs: "95vw", sm: "80vw" },
                    }}
                >
                    <IconButton
                        onClick={handleClose}
                        sx={{
                            position: "absolute",
                            top: 16,
                            right: 16,
                            color: "white",
                            zIndex: 1,
                        }}
                    >
                        <Close />
                    </IconButton>

                    <IconButton
                        onClick={handlePrev}
                        size={isXs ? "small" : "medium"}
                        sx={{
                            position: "absolute",
                            left: { xs: 4, sm: 16 },
                            color: "white",
                            backgroundColor: "rgba(255,255,255,0.1)",
                            "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.2)",
                            },
                        }}
                    >
                        <ChevronLeft fontSize={isXs ? "medium" : "large"} />
                    </IconButton>

                    <Box
                        component="img"
                        src={currentImage?.url}
                        alt={currentImage?.altText || currentImage?.title || ""}
                        sx={{
                            maxWidth: "90vw",
                            maxHeight: "85vh",
                            objectFit: "contain",
                        }}
                    />

                    <IconButton
                        onClick={handleNext}
                        size={isXs ? "small" : "medium"}
                        sx={{
                            position: "absolute",
                            right: { xs: 4, sm: 16 },
                            color: "white",
                            backgroundColor: "rgba(255,255,255,0.1)",
                            "&:hover": {
                                backgroundColor: "rgba(255,255,255,0.2)",
                            },
                        }}
                    >
                        <ChevronRight fontSize={isXs ? "medium" : "large"} />
                    </IconButton>

                    {(currentImage?.title || currentImage?.description) && (
                        <Box
                            sx={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                p: 3,
                                background:
                                    "linear-gradient(transparent, rgba(0,0,0,0.8))",
                                color: "white",
                            }}
                        >
                            {currentImage.title && (
                                <Typography variant="h6">
                                    {currentImage.title}
                                </Typography>
                            )}
                            {currentImage.description && (
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                    {currentImage.description}
                                </Typography>
                            )}
                        </Box>
                    )}

                    <Typography
                        sx={{
                            position: "absolute",
                            bottom: 16,
                            right: 16,
                            color: "white",
                            opacity: 0.6,
                        }}
                    >
                        {currentIndex + 1} / {images.length}
                    </Typography>
                </DialogContent>
            </Dialog>
        </>
    );
}
