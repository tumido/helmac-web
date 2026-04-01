"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    CardActions,
    Collapse,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    IconButton,
    Paper,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
    Add,
    Delete,
    ExpandMore,
    ExpandLess,
    Sell,
    CategoryOutlined,
    CalendarTodayOutlined,
    WarningAmberOutlined,
} from "@mui/icons-material";
import dayjs from "dayjs";
import type { PricingDefinition, PricedOption, FormElement } from "@/lib/types/registration-form";
import { isConditionBlock } from "@/lib/types/registration-form";

interface PricingEditorProps {
    pricingDefinitions: PricingDefinition[];
    elements: FormElement[];
    onChange: (definitions: PricingDefinition[]) => void;
}

interface BlockInfo {
    definitionName: string;
    fieldCount: number;
}

export function PricingEditor({ pricingDefinitions, elements, onChange }: PricingEditorProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [blockInfo, setBlockInfo] = useState<BlockInfo | null>(null);

    // Check if a pricing definition is referenced by any pricing_select field
    const getFieldsUsingDefinition = (definitionId: string): number => {
        let count = 0;
        for (const el of elements) {
            if (isConditionBlock(el)) {
                for (const child of el.children) {
                    if (child.type === "pricing_select" && "pricingId" in child && child.pricingId === definitionId) {
                        count++;
                    }
                }
            } else if (el.type === "pricing_select" && "pricingId" in el && el.pricingId === definitionId) {
                count++;
            }
        }
        return count;
    };

    const handleAddDefinition = () => {
        const newDef: PricingDefinition = {
            id: crypto.randomUUID(),
            name: "",
            priceTiers: [],
            options: [
                {
                    id: crypto.randomUUID(),
                    name: "",
                    description: "",
                    prices: [0], // one fallback price
                },
            ],
        };
        onChange([...pricingDefinitions, newDef]);
        setExpandedId(newDef.id);
    };

    const handleUpdateDefinition = (id: string, updates: Partial<PricingDefinition>) => {
        onChange(pricingDefinitions.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    };

    const handleDeleteDefinition = (id: string) => {
        const fieldCount = getFieldsUsingDefinition(id);
        if (fieldCount > 0) {
            const def = pricingDefinitions.find((d) => d.id === id);
            setBlockInfo({
                definitionName: def?.name || "(nepojmenovaná)",
                fieldCount,
            });
            return;
        }
        onChange(pricingDefinitions.filter((d) => d.id !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const handleAddTier = (definitionId: string) => {
        onChange(pricingDefinitions.map((d) => {
            if (d.id !== definitionId) return d;
            const newTiers = [...d.priceTiers, ""];
            // Add a price slot at the second-to-last position for each option
            // (last position is always the fallback)
            const newOptions = d.options.map((opt) => {
                const prices = [...opt.prices];
                // Insert a 0 before the fallback (last element)
                prices.splice(prices.length - 1, 0, 0);
                return { ...opt, prices };
            });
            return { ...d, priceTiers: newTiers, options: newOptions };
        }));
    };

    const handleRemoveTier = (definitionId: string, tierIndex: number) => {
        onChange(pricingDefinitions.map((d) => {
            if (d.id !== definitionId) return d;
            const newTiers = d.priceTiers.filter((_, i) => i !== tierIndex);
            const newOptions = d.options.map((opt) => {
                const prices = opt.prices.filter((_, i) => i !== tierIndex);
                return { ...opt, prices };
            });
            return { ...d, priceTiers: newTiers, options: newOptions };
        }));
    };

    const handleUpdateTier = (definitionId: string, tierIndex: number, value: string) => {
        onChange(pricingDefinitions.map((d) => {
            if (d.id !== definitionId) return d;
            const newTiers = [...d.priceTiers];
            newTiers[tierIndex] = value;
            return { ...d, priceTiers: newTiers };
        }));
    };

    const handleAddOption = (definitionId: string) => {
        onChange(pricingDefinitions.map((d) => {
            if (d.id !== definitionId) return d;
            const newOption: PricedOption = {
                id: crypto.randomUUID(),
                name: "",
                description: "",
                prices: new Array(d.priceTiers.length + 1).fill(0),
            };
            return { ...d, options: [...d.options, newOption] };
        }));
    };

    const handleUpdateOption = (definitionId: string, optionId: string, updates: Partial<PricedOption>) => {
        onChange(pricingDefinitions.map((d) => {
            if (d.id !== definitionId) return d;
            return {
                ...d,
                options: d.options.map((o) => (o.id === optionId ? { ...o, ...updates } : o)),
            };
        }));
    };

    const handleUpdateOptionPrice = (definitionId: string, optionId: string, priceIndex: number, value: number) => {
        onChange(pricingDefinitions.map((d) => {
            if (d.id !== definitionId) return d;
            return {
                ...d,
                options: d.options.map((o) => {
                    if (o.id !== optionId) return o;
                    const newPrices = [...o.prices];
                    newPrices[priceIndex] = value;
                    return { ...o, prices: newPrices };
                }),
            };
        }));
    };

    const handleDeleteOption = (definitionId: string, optionId: string) => {
        onChange(pricingDefinitions.map((d) => {
            if (d.id !== definitionId) return d;
            return { ...d, options: d.options.filter((o) => o.id !== optionId) };
        }));
    };

    // Stats
    const totalGroups = pricingDefinitions.length;
    const totalActiveTiers = pricingDefinitions.reduce((sum, d) => {
        const now = new Date().toISOString().split("T")[0];
        return sum + d.priceTiers.filter((t) => t && t >= now).length;
    }, 0);
    const expiringTiers = pricingDefinitions.reduce((sum, d) => {
        const now = new Date();
        const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const today = now.toISOString().split("T")[0];
        return sum + d.priceTiers.filter((t) => t && t >= today && t <= twoWeeksFromNow).length;
    }, 0);

    return (
        <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Ceník
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Definujte cenové skupiny s termínovými slevami. Poté je přetáhněte z palety do formuláře.
            </Typography>

            {pricingDefinitions.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
                    Zatím nejsou definovány žádné cenové skupiny.
                </Typography>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {pricingDefinitions.map((def) => {
                    const isExpanded = expandedId === def.id;
                    return (
                        <Card key={def.id} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    px: 2,
                                    py: 1.5,
                                    cursor: "pointer",
                                }}
                                onClick={() => setExpandedId(isExpanded ? null : def.id)}
                            >
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 1,
                                        backgroundColor: "success.main",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Sell sx={{ fontSize: 18, color: "white" }} />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body1" fontWeight={500} noWrap>
                                        {def.name || "(nepojmenovaná)"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {def.options.length} {def.options.length === 1 ? "možnost" : "možnosti"} · {def.priceTiers.length} {def.priceTiers.length === 1 ? "termín" : "termíny"}
                                    </Typography>
                                </Box>
                                {isExpanded ? <ExpandLess color="action" /> : <ExpandMore color="action" />}
                                <Tooltip title="Smazat cenovou skupinu">
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDefinition(def.id);
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            <Collapse in={isExpanded}>
                                <CardContent sx={{ pt: 0 }}>
                                    <TextField
                                        label="Název cenové skupiny"
                                        value={def.name}
                                        onChange={(e) => handleUpdateDefinition(def.id, { name: e.target.value })}
                                        size="small"
                                        fullWidth
                                        sx={{ mb: 2 }}
                                        placeholder='např. "Ubytování", "Vstupné"'
                                    />

                                    {/* Price tiers */}
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Cenové termíny
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                                        Ceny platí do uvedeného data. Po posledním termínu platí cena &bdquo;na místě&ldquo;.
                                    </Typography>

                                    {/* Tier cards displayed side by side */}
                                    {def.priceTiers.length > 0 && (
                                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                                            {def.priceTiers.map((tier, idx) => (
                                                <Paper
                                                    key={idx}
                                                    variant="outlined"
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1,
                                                        p: 1,
                                                        borderRadius: 1,
                                                        flex: "1 1 auto",
                                                        minWidth: 180,
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ minWidth: 60, fontWeight: 500 }}>
                                                        Termín {idx + 1}
                                                    </Typography>
                                                    <DatePicker
                                                        value={tier ? dayjs(tier) : null}
                                                        onChange={(v) => handleUpdateTier(def.id, idx, v?.format("YYYY-MM-DD") ?? "")}
                                                        format="DD.MM.YYYY"
                                                        slotProps={{
                                                            textField: {
                                                                size: "small",
                                                                sx: { flex: 1 },
                                                            },
                                                        }}
                                                    />
                                                    <Tooltip title="Odebrat termín">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRemoveTier(def.id, idx)}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Paper>
                                            ))}
                                        </Box>
                                    )}
                                    <Button
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => handleAddTier(def.id)}
                                        sx={{ mb: 2 }}
                                    >
                                        Přidat termín
                                    </Button>

                                    {/* Options */}
                                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                        Možnosti
                                    </Typography>
                                    {def.options.map((option) => (
                                        <Box
                                            key={option.id}
                                            sx={{
                                                p: 1.5,
                                                mb: 1,
                                                border: "1px solid",
                                                borderColor: "divider",
                                                borderRadius: 1,
                                                backgroundColor: "action.hover",
                                            }}
                                        >
                                            <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                                                <TextField
                                                    label="Název možnosti"
                                                    value={option.name}
                                                    onChange={(e) => handleUpdateOption(def.id, option.id, { name: e.target.value })}
                                                    size="small"
                                                    sx={{ flex: 1 }}
                                                />
                                                <Tooltip title="Smazat možnost">
                                                    <span>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleDeleteOption(def.id, option.id)}
                                                            disabled={def.options.length <= 1}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                            <TextField
                                                label="Popis"
                                                value={option.description}
                                                onChange={(e) => handleUpdateOption(def.id, option.id, { description: e.target.value })}
                                                size="small"
                                                fullWidth
                                                sx={{ mb: 1 }}
                                            />
                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                {def.priceTiers.map((tier, tierIdx) => (
                                                    <TextField
                                                        key={tierIdx}
                                                        label={`Do ${tier || "?"}`}
                                                        type="number"
                                                        value={option.prices[tierIdx] ?? 0}
                                                        onChange={(e) => handleUpdateOptionPrice(def.id, option.id, tierIdx, Number(e.target.value) || 0)}
                                                        size="small"
                                                        sx={{ width: 130 }}
                                                        InputProps={{
                                                            endAdornment: <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>Kč</Typography>,
                                                        }}
                                                    />
                                                ))}
                                                <TextField
                                                    label="Na místě"
                                                    type="number"
                                                    value={option.prices[def.priceTiers.length] ?? 0}
                                                    onChange={(e) => handleUpdateOptionPrice(def.id, option.id, def.priceTiers.length, Number(e.target.value) || 0)}
                                                    size="small"
                                                    sx={{ width: 130 }}
                                                    InputProps={{
                                                        endAdornment: <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>Kč</Typography>,
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    ))}
                                </CardContent>
                                <CardActions sx={{ px: 2, pt: 0 }}>
                                    <Button
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => handleAddOption(def.id)}
                                    >
                                        Přidat možnost
                                    </Button>
                                </CardActions>
                            </Collapse>
                        </Card>
                    );
                })}
            </Box>

            <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddDefinition}
                sx={{ mt: 2 }}
                fullWidth
            >
                Přidat cenovou skupinu
            </Button>

            {/* Stats summary */}
            {pricingDefinitions.length > 0 && (
                <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
                    <Paper variant="outlined" sx={{ p: 2, flex: "1 1 0", minWidth: 140, borderRadius: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <CategoryOutlined sx={{ fontSize: 18, color: "primary.main" }} />
                            <Typography variant="caption" color="text.secondary">
                                Celkem skupin
                            </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                            {totalGroups}
                        </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: "1 1 0", minWidth: 140, borderRadius: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <CalendarTodayOutlined sx={{ fontSize: 18, color: "success.main" }} />
                            <Typography variant="caption" color="text.secondary">
                                Aktivních termínů
                            </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                            {totalActiveTiers}
                        </Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: "1 1 0", minWidth: 140, borderRadius: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                            <WarningAmberOutlined sx={{ fontSize: 18, color: "warning.main" }} />
                            <Typography variant="caption" color="text.secondary">
                                Končící termíny
                            </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={600}>
                            {expiringTiers}
                        </Typography>
                    </Paper>
                </Box>
            )}

            <Dialog open={!!blockInfo} onClose={() => setBlockInfo(null)}>
                <DialogTitle>Nelze smazat cenovou skupinu</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Cenová skupina &bdquo;{blockInfo?.definitionName}&ldquo; je používána v {blockInfo?.fieldCount}{" "}
                        {blockInfo?.fieldCount === 1 ? "poli" : "polích"} ve formuláři.
                        Nejdříve odstraňte všechna pole cenového výběru, která ji používají.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBlockInfo(null)} variant="contained">
                        Rozumím
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
