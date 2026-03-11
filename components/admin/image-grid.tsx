"use client";

import { useState } from "react";
import {
    Box,
    Card,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress,
    Typography,
} from "@mui/material";
import { Delete, Edit, BrokenImage } from "@mui/icons-material";
import { deleteImage } from "@/lib/actions/albums";
import { useRouter } from "next/navigation";
import { IconLinkButton } from "@/components/ui/link-button";
import { useToast } from "@/lib/hooks/use-toast";

interface Image {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    title: string | null;
    altText: string | null;
}

interface ImageGridProps {
    images: Image[];
    albumId: string;
    basePath?: string;
}

function ImageCard({ image, albumId, basePath }: { image: Image; albumId: string; basePath?: string }) {
    const router = useRouter();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        const result = await deleteImage(image.id);
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Obrázek byl smazán");
            router.refresh();
        }
    };

    const imageUrl = image.thumbnailUrl || image.url;

    return (
        <>
            <Card
                sx={{
                    position: "relative",
                    aspectRatio: "1",
                    overflow: "hidden",
                    "&:hover .image-actions": {
                        opacity: 1,
                    },
                }}
            >
                {imageError ? (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "grey.200",
                        }}
                    >
                        <BrokenImage sx={{ fontSize: 48, color: "grey.400" }} />
                    </Box>
                ) : (
                    <Box
                        component="img"
                        src={imageUrl}
                        alt={image.altText || image.title || ""}
                        onError={() => setImageError(true)}
                        sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                        }}
                    />
                )}

                <Box
                    className="image-actions"
                    sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        opacity: 0,
                        transition: "opacity 0.2s",
                    }}
                >
                    {loading ? (
                        <CircularProgress size={32} sx={{ color: "white" }} />
                    ) : (
                        <>
                            <Tooltip title="Upravit">
                                <IconLinkButton
                                    href={`${basePath || `/admin/galerie/${albumId}`}/obrazky/${image.id}`}
                                    sx={{ color: "white" }}
                                >
                                    <Edit />
                                </IconLinkButton>
                            </Tooltip>
                            <Tooltip title="Smazat">
                                <IconButton
                                    onClick={() => setDeleteDialogOpen(true)}
                                    sx={{ color: "white" }}
                                >
                                    <Delete />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </Box>

                {image.title && (
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            p: 1,
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{ color: "white" }}
                            noWrap
                        >
                            {image.title}
                        </Typography>
                    </Box>
                )}
            </Card>

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Smazat obrázek?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat tento obrázek? Tato akce je nevratná.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Zrušit
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                    >
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export function ImageGrid({ images, albumId, basePath }: ImageGridProps) {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "repeat(2, 1fr)",
                    sm: "repeat(3, 1fr)",
                    md: "repeat(4, 1fr)",
                },
                gap: 2,
            }}
        >
            {images.map((image) => (
                <ImageCard key={image.id} image={image} albumId={albumId} basePath={basePath} />
            ))}
        </Box>
    );
}
