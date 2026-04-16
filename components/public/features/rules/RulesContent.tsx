"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { RuleTabs } from "./RuleTabs";
import { RuleItem } from "./rules.types";

interface RulesContentProps {
    rules: RuleItem[];
}

export function RulesContent({ rules }: RulesContentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const initialId = (tabParam && rules.some((r) => r.id === tabParam))
        ? tabParam
        : rules[0]?.id || "";

    const [selectedRuleId, setSelectedRuleId] = useState(initialId);

    useEffect(() => {
        if (tabParam && rules.some((r) => r.id === tabParam)) {
            setSelectedRuleId(tabParam);
        }
    }, [tabParam]);

    const handleRuleChange = (ruleId: string) => {
        setSelectedRuleId(ruleId);
        router.replace(`${pathname}?tab=${ruleId}`, { scroll: false });
    };

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
                onRuleChange={handleRuleChange}
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
                    "& ul": { listStyleType: "disc" },
                    "& ol": { listStyleType: "decimal" },
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
                    "& table": {
                        display: "block",
                        overflowX: "auto",
                    },
                    "& pre": {
                        overflowX: "auto",
                    },
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                    lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ __html: selectedRule.content }}
            />
        </Box>
    );
}
