"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { TabScrollButton } from "@/components/public/ui/TabScrollButton";
import { RuleItem } from "./rules.types";

interface RuleTabsProps {
    rules: RuleItem[];
    selectedRuleId: string;
    onRuleChange: (ruleId: string) => void;
}

export function RuleTabs({ rules, selectedRuleId, onRuleChange }: RuleTabsProps) {
    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        onRuleChange(newValue);
    };

    return (
        <Box
            sx={{
                borderBottom: 1,
                borderColor: "divider",
                mb: 3,
            }}
        >
            <Tabs
                value={selectedRuleId}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                ScrollButtonComponent={TabScrollButton}
                sx={{
                    "& .MuiTab-root": {
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 600,
                        fontSize: { xs: "0.875rem", sm: "1rem" },
                        textTransform: "none",
                        minWidth: { xs: "auto", sm: 120 },
                        px: { xs: 2, sm: 3 },
                    },
                    "& .Mui-selected": {
                        color: "primary.main",
                    },
                    "& .MuiTabs-indicator": {
                        backgroundColor: "primary.main",
                        height: 3,
                    },
                }}
            >
                {rules.map((rule) => (
                    <Tab
                        key={rule.id}
                        label={rule.title}
                        value={rule.id}
                    />
                ))}
            </Tabs>
        </Box>
    );
}
