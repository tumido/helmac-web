"use client";

import { Box, Tooltip, Typography } from "@mui/material";
import { Edit, InfoOutlined } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { SortableList } from "@/components/admin/sortable-list";
import { InfoActions } from "@/components/admin/info-actions";
import { reorderInfoSections } from "@/lib/actions/info";
import { useToast } from "@/lib/hooks/use-toast";

interface InfoSection {
    id: string;
    title: string;
}

interface SortableInfoProps {
    yearId: string;
    infoSections: InfoSection[];
}

export function SortableInfo({ yearId, infoSections }: SortableInfoProps) {
    const toast = useToast();

    const handleReorder = async (newOrder: string[]) => {
        const result = await reorderInfoSections(yearId, newOrder);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Pořadí info sekcí bylo změněno");
        }
    };

    return (
        <SortableList
            items={infoSections}
            getId={(info) => info.id}
            onReorder={handleReorder}
            renderItem={(info) => (
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
                    <InfoOutlined sx={{ color: "text.disabled" }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight="medium">
                            {info.title}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Tooltip title="Upravit info sekci">
                            <IconLinkButton
                                href={`/admin/rocniky/${yearId}/info/${info.id}`}
                                size="small"
                            >
                                <Edit />
                            </IconLinkButton>
                        </Tooltip>
                        <InfoActions
                            infoId={info.id}
                            infoTitle={info.title}
                        />
                    </Box>
                </Box>
            )}
        />
    );
}
