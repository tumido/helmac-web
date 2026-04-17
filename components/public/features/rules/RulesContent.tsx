"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { RuleTabs } from "./RuleTabs";
import { RuleItem } from "./rules.types";
import { richContentSx } from "@/lib/utils/rich-content-sx";

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
                sx={richContentSx}
                dangerouslySetInnerHTML={{ __html: selectedRule.content }}
            />
        </Box>
    );
}
