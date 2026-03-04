"use client";

import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { Edit, Visibility, VisibilityOff } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { SortableList } from "@/components/admin/sortable-list";
import { PageActions } from "@/components/admin/page-actions";
import { reorderPages } from "@/lib/actions/pages";
import { useToast } from "@/lib/hooks/use-toast";

interface Page {
    id: string;
    slug: string;
    title: string;
    isPublished: boolean;
}

interface SortablePagesProps {
    yearId: string;
    pages: Page[];
}

export function SortablePages({ yearId, pages }: SortablePagesProps) {
    const toast = useToast();

    const handleReorder = async (newOrder: string[]) => {
        const result = await reorderPages(yearId, newOrder);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Pořadí stránek bylo změněno");
        }
    };

    return (
        <SortableList
            items={pages}
            getId={(page) => page.id}
            onReorder={handleReorder}
            renderItem={(page) => (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        flex: 1,
                        py: 1,
                        pr: 1,
                    }}
                >
                    <Box sx={{ flex: 1 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            <Typography fontWeight="medium">
                                {page.title}
                            </Typography>
                            <Chip
                                label={
                                    page.isPublished
                                        ? "Publikováno"
                                        : "Skryto"
                                }
                                size="small"
                                color={
                                    page.isPublished
                                        ? "success"
                                        : "default"
                                }
                                icon={
                                    page.isPublished ? (
                                        <Visibility />
                                    ) : (
                                        <VisibilityOff />
                                    )
                                }
                            />
                        </Box>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            /{page.slug}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Tooltip title="Upravit stránku">
                            <IconLinkButton
                                href={`/admin/rocniky/${yearId}/stranky/${page.id}`}
                                size="small"
                            >
                                <Edit />
                            </IconLinkButton>
                        </Tooltip>
                        <PageActions
                            pageId={page.id}
                            isPublished={page.isPublished}
                        />
                    </Box>
                </Box>
            )}
        />
    );
}
