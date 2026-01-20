"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    Box,
    Checkbox,
    Typography,
    Chip,
    Divider,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from "@mui/material";
import {
    Edit,
    Visibility,
    VisibilityOff,
    PhotoLibrary,
} from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { AlbumActions } from "@/components/admin/album-actions";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { bulkPublishAlbums, bulkUnpublishAlbums, bulkDeleteAlbums } from "@/lib/actions/albums";
import { useToast } from "@/lib/hooks/use-toast";

interface Album {
    id: string;
    slug: string;
    title: string;
    isPublished: boolean;
    _count: {
        images: number;
    };
    year: {
        year: number;
        title: string;
    };
}

interface SelectableAlbumListProps {
    albums: Album[];
}

export function SelectableAlbumList({ albums }: SelectableAlbumListProps) {
    const router = useRouter();
    const toast = useToast();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const allSelected = albums.length > 0 && selected.size === albums.length;
    const someSelected = selected.size > 0 && selected.size < albums.length;

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(albums.map((a) => a.id)));
        }
    };

    const toggleOne = (id: string) => {
        const newSelected = new Set(selected);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelected(newSelected);
    };

    const handleBulkPublish = async () => {
        setLoading(true);
        const result = await bulkPublishAlbums(Array.from(selected));
        setLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`${result.count} alb publikovano`);
            setSelected(new Set());
            router.refresh();
        }
    };

    const handleBulkUnpublish = async () => {
        setLoading(true);
        const result = await bulkUnpublishAlbums(Array.from(selected));
        setLoading(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`${result.count} alb skryto`);
            setSelected(new Set());
            router.refresh();
        }
    };

    const handleBulkDelete = async () => {
        setLoading(true);
        const result = await bulkDeleteAlbums(Array.from(selected));
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`${result.count} alb smazano`);
            setSelected(new Set());
            router.refresh();
        }
    };

    return (
        <>
            <BulkActionBar
                selectedCount={selected.size}
                onPublish={handleBulkPublish}
                onUnpublish={handleBulkUnpublish}
                onDelete={() => setDeleteDialogOpen(true)}
                onClear={() => setSelected(new Set())}
                loading={loading}
            />

            <Card>
                {/* Header with select all */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        p: 1.5,
                        backgroundColor: "grey.50",
                        borderBottom: 1,
                        borderColor: "divider",
                    }}
                >
                    <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleAll}
                        size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                        {selected.size > 0
                            ? `Vybrano ${selected.size} z ${albums.length}`
                            : `Celkem ${albums.length} alb`}
                    </Typography>
                </Box>

                {/* Album items */}
                {albums.map((album, index) => (
                    <Box key={album.id}>
                        {index > 0 && <Divider />}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 2,
                                backgroundColor: selected.has(album.id)
                                    ? "action.selected"
                                    : "transparent",
                                transition: "background-color 0.2s",
                            }}
                        >
                            <Checkbox
                                checked={selected.has(album.id)}
                                onChange={() => toggleOne(album.id)}
                                size="small"
                            />
                            <Box sx={{ flex: 1 }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <Typography fontWeight="medium">
                                        {album.title}
                                    </Typography>
                                    <Chip
                                        label={
                                            album.isPublished
                                                ? "Publikovano"
                                                : "Koncept"
                                        }
                                        size="small"
                                        color={
                                            album.isPublished
                                                ? "success"
                                                : "default"
                                        }
                                        icon={
                                            album.isPublished ? (
                                                <Visibility />
                                            ) : (
                                                <VisibilityOff />
                                            )
                                        }
                                    />
                                </Box>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mt: 0.5,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {album.year.year} - {album.year.title}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        |
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                        }}
                                    >
                                        <PhotoLibrary
                                            fontSize="small"
                                            sx={{ color: "text.secondary" }}
                                        />
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {album._count.images} obrazku
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                }}
                            >
                                <Tooltip title="Upravit album">
                                    <IconLinkButton
                                        href={`/admin/galerie/${album.id}`}
                                        size="small"
                                    >
                                        <Edit />
                                    </IconLinkButton>
                                </Tooltip>
                                <AlbumActions
                                    albumId={album.id}
                                    isPublished={album.isPublished}
                                />
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Card>

            {/* Delete confirmation dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Smazat vybrana alba?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat {selected.size} vybranych alb?
                        Budou smazany i vsechny obrazky v techto albech.
                        Tato akce je nevratna.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Zrusit
                    </Button>
                    <Button
                        onClick={handleBulkDelete}
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
