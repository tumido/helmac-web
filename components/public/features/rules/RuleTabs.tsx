"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { TabScrollButton } from "@/components/public/ui/TabScrollButton";
import { GameIcon } from "@/lib/icons";
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
                scrollButtons
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
                        icon={rule.icon ? <GameIcon name={rule.icon} sx={{ fontSize: "1.2em" }} /> : undefined}
                        iconPosition="start"
                        label={
                            rule.subtitle ? (
                                <span>
                                    {rule.title}
                                    <br />
                                    <span style={{ fontSize: "0.75em", fontWeight: 400, opacity: 0.7 }}>
                                        {rule.subtitle}
                                    </span>
                                </span>
                            ) : (
                                rule.title
                            )
                        }
                        value={rule.id}
                    />
                ))}
            </Tabs>
        </Box>
    );
}
