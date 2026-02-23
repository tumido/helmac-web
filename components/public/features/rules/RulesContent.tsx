"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { RuleTabs } from "./RuleTabs";
import { RuleItem } from "./rules.types";

interface RulesContentProps {
    rules: RuleItem[];
}

export function RulesContent({ rules }: RulesContentProps) {
    const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id || "");

    if (rules.length === 0) {
        return (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Zatim nebyla pridana zadna pravidla.
            </Typography>
        );
    }

    const selectedRule = rules.find((r) => r.id === selectedRuleId) || rules[0];

    return (
        <Box>
            <RuleTabs
                rules={rules}
                selectedRuleId={selectedRule.id}
                onRuleChange={setSelectedRuleId}
            />
            <Typography
                variant="body1"
                component="div"
                sx={{
                    "& p": { mb: 2 },
                    "& h2": {
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        mt: 3,
                        mb: 1,
                    },
                    "& h3": {
                        fontSize: "1.25rem",
                        fontWeight: 600,
                        mt: 2,
                        mb: 1,
                    },
                    "& ul, & ol": {
                        pl: 3,
                        mb: 2,
                    },
                    "& blockquote": {
                        borderLeft: "4px solid",
                        borderColor: "divider",
                        pl: 2,
                        ml: 0,
                        fontStyle: "italic",
                        color: "text.secondary",
                    },
                    "& a": {
                        color: "primary.main",
                        textDecoration: "underline",
                    },
                    "& img": {
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: 2,
                        my: 2,
                    },
                    lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ __html: selectedRule.content }}
            />
        </Box>
    );
}
