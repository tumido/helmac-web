"use client";

import { Box, Tooltip, Typography } from "@mui/material";
import { Edit, Gavel } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { SortableList } from "@/components/admin/sortable-list";
import { RuleActions } from "@/components/admin/rule-actions";
import { reorderRules } from "@/lib/actions/rules";
import { useToast } from "@/lib/hooks/use-toast";

interface Rule {
    id: string;
    title: string;
}

interface SortableRulesProps {
    yearId: string;
    rules: Rule[];
}

export function SortableRules({ yearId, rules }: SortableRulesProps) {
    const toast = useToast();

    const handleReorder = async (newOrder: string[]) => {
        const result = await reorderRules(yearId, newOrder);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Pořadí pravidel bylo změněno");
        }
    };

    return (
        <SortableList
            items={rules}
            getId={(rule) => rule.id}
            onReorder={handleReorder}
            renderItem={(rule) => (
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
                    <Gavel sx={{ color: "text.disabled" }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight="medium">
                            {rule.title}
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                        }}
                    >
                        <Tooltip title="Upravit pravidlo">
                            <IconLinkButton
                                href={`/admin/rocniky/${yearId}/pravidla/${rule.id}`}
                                size="small"
                            >
                                <Edit />
                            </IconLinkButton>
                        </Tooltip>
                        <RuleActions
                            ruleId={rule.id}
                            ruleTitle={rule.title}
                        />
                    </Box>
                </Box>
            )}
        />
    );
}
