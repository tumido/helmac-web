"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Box, Typography } from "@mui/material";
import { RuleTabs } from "./RuleTabs";
import { RuleItem } from "./rules.types";
import { ContentWithToc } from "@/components/public/features/toc";

interface RulesContentProps {
    rules: RuleItem[];
}

export function RulesContent({ rules }: RulesContentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const selectedRuleId = (tabParam && rules.some((r) => r.id === tabParam))
        ? tabParam
        : rules[0]?.id || "";

    const handleRuleChange = (ruleId: string) => {
        router.replace(`${pathname}?tab=${ruleId}`, { scroll: false });
    };

    if (rules.length === 0) {
        return (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                Zatím nebyla přidána žádná pravidla.
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
            <ContentWithToc content={selectedRule.content} showToc={selectedRule.showToc} />
        </Box>
    );
}
