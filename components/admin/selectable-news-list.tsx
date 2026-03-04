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
import { NewsActions } from "@/components/admin/news-actions";
import { BulkActionBar } from "@/components/admin/bulk-action-bar";
import { bulkDeleteNews } from "@/lib/actions/news";
import { useToast } from "@/lib/hooks/use-toast";

interface News {
    id: string;
    slug: string;
    title: string;
    publishedAt: Date | null;
    year: {
        year: number;
        title: string;
    };
}

interface SelectableNewsListProps {
    news: News[];
}

function formatDate(date: Date | null): string {
    if (!date) return "";
    return new Intl.DateTimeFormat("cs-CZ").format(new Date(date));
}

export function SelectableNewsList({ news }: SelectableNewsListProps) {
    const router = useRouter();
    const toast = useToast();
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const allSelected = news.length > 0 && selected.size === news.length;
    const someSelected = selected.size > 0 && selected.size < news.length;

    const toggleAll = () => {
        if (allSelected) {
            setSelected(new Set());
        } else {
            setSelected(new Set(news.map((n) => n.id)));
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
        const result = await bulkDeleteNews(Array.from(selected));
        setLoading(false);
        setDeleteDialogOpen(false);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`${result.count} novinek smazano`);
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
                            ? `Vybrano ${selected.size} z ${news.length}`
                            : `Celkem ${news.length} novinek`}
                    </Typography>
                </Box>

                {/* News items */}
                {news.map((item, index) => (
                    <Box key={item.id}>
                        {index > 0 && <Divider />}
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                p: 2,
                                backgroundColor: selected.has(item.id)
                                    ? "action.selected"
                                    : "transparent",
                                transition: "background-color 0.2s",
                            }}
                        >
                            <Checkbox
                                checked={selected.has(item.id)}
                                onChange={() => toggleOne(item.id)}
                                size="small"
                            />
                            <Box sx={{ flex: 1 }}>
                                <Typography fontWeight="medium">
                                    {item.title}
                                </Typography>
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
                                        {item.year.year} - {item.year.title}
                                    </Typography>
                                    {item.publishedAt && (
                                        <>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                |
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {formatDate(item.publishedAt)}
                                            </Typography>
                                        </>
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
                                <Tooltip title="Upravit novinku">
                                    <IconLinkButton
                                        href={`/admin/novinky/${item.id}`}
                                        size="small"
                                    >
                                        <Edit />
                                    </IconLinkButton>
                                </Tooltip>
                                <NewsActions
                                    newsId={item.id}
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
                <DialogTitle>Smazat vybrane novinky?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat {selected.size} vybranych novinek?
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
