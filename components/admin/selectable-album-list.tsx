"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Card,
    Box,
    Checkbox,
    Typography,
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
} from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { AlbumActions } from "@/components/admin/album-actions";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { bulkDeleteAlbums } from "@/lib/actions/albums";
import { useToast } from "@/lib/hooks/use-toast";

interface Album {
    id: string;
    slug: string;
    title: string;
    year: {
        year: number;
        title: string;
    };
}

interface SelectableAlbumListProps {
    albums: Album[];
    editBasePath?: string;
    showYear?: boolean;
}

export function SelectableAlbumList({ albums, editBasePath = "/admin/galerie", showYear = true }: SelectableAlbumListProps) {
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

    const handleBulkDelete = async () => {
        setLoading(true);
        const result = await bulkDeleteAlbums(Array.from(selected));
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`${result.count} alb smazáno`);
            setSelected(new Set());
            router.refresh();
        }
    };

    return (
        <>
            <BulkActionBar
                selectedCount={selected.size}
                onDelete={() => setDeleteDialogOpen(true)}
                onClear={() => setSelected(new Set())}
                loading={loading}
                showPublishActions={false}
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
                            ? `Vybráno ${selected.size} z ${albums.length}`
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
                                <Typography fontWeight="medium">
                                    {album.title}
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        mt: 0.5,
                                    }}
                                >
                                    {showYear && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {album.year.year} - {album.year.title}
                                        </Typography>
                                    )}
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
                                        href={`${editBasePath}/${album.id}`}
                                        size="small"
                                    >
                                        <Edit />
                                    </IconLinkButton>
                                </Tooltip>
                                <AlbumActions
                                    albumId={album.id}
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
                <DialogTitle>Smazat vybraná alba?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat {selected.size} vybraných alb?
                        Tato akce je nevratná.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                        Zrušit
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
