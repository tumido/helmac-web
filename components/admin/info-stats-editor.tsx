"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    ListItemText,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { Add, Check, Close, Delete, Edit } from "@mui/icons-material";
import type { InfoStatsConfig, InfoStatItem, InputField, OptionCounts } from "@/lib/types/registration-form";
import { saveInfoStatsConfig } from "@/lib/actions/info-stats";

interface InfoStatsEditorProps {
    yearId: string;
    infoStatsConfig?: InfoStatsConfig;
    allInputFields: InputField[];
    optionFields: InputField[];
    optionCounts?: OptionCounts;
}

const defaultConfig: InfoStatsConfig = {
    enabled: false,
    stats: [],
};

function createNewStat(): InfoStatItem {
    return {
        id: crypto.randomUUID(),
        fieldIds: [],
        showPeople: false,
    };
}

export function InfoStatsEditor({
    yearId,
    infoStatsConfig: initialConfig,
    allInputFields,
    optionFields,
}: InfoStatsEditorProps) {
    const [config, setConfig] = useState<InfoStatsConfig>(initialConfig ?? defaultConfig);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingStat, setEditingStat] = useState<InfoStatItem | null>(null);
    const [isNewStat, setIsNewStat] = useState(false);

    const getFieldLabel = (fieldId: string) => {
        return optionFields.find((f) => f.id === fieldId)?.label
            ?? allInputFields.find((f) => f.id === fieldId)?.label
            ?? "(neznámé pole)";
    };

    const autoSave = async (newConfig: InfoStatsConfig) => {
        setConfig(newConfig);
        setSaving(true);
        setError(null);
        const result = await saveInfoStatsConfig(yearId, newConfig);
        if (result.error) {
            setError(result.error);
        }
        setSaving(false);
    };

    const handleAddStat = () => {
        setEditingStat(createNewStat());
        setIsNewStat(true);
    };

    const handleEditStat = (stat: InfoStatItem) => {
        setEditingStat({ ...stat });
        setIsNewStat(false);
    };

    const handleDeleteStat = (statId: string) => {
        const newConfig = {
            ...config,
            stats: config.stats.filter((s) => s.id !== statId),
        };
        if (editingStat?.id === statId) {
            setEditingStat(null);
            setIsNewStat(false);
        }
        autoSave(newConfig);
    };

    const handleConfirmEdit = () => {
        if (!editingStat || editingStat.fieldIds.length === 0) return;

        let newConfig: InfoStatsConfig;
        if (isNewStat) {
            newConfig = { ...config, stats: [...config.stats, editingStat] };
        } else {
            newConfig = {
                ...config,
                stats: config.stats.map((s) => s.id === editingStat.id ? editingStat : s),
            };
        }
        setEditingStat(null);
        setIsNewStat(false);
        autoSave(newConfig);
    };

    const handleCancelEdit = () => {
        setEditingStat(null);
        setIsNewStat(false);
    };

    return (
        <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">
                    Statistiky na info stránce
                </Typography>
                {config.enabled && !editingStat && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Add />}
                        onClick={handleAddStat}
                        disabled={saving}
                    >
                        Přidat statistiku
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.enabled}
                            disabled={saving}
                            onChange={(e) => {
                                const enabled = e.target.checked;
                                if (!enabled) {
                                    setEditingStat(null);
                                    setIsNewStat(false);
                                }
                                autoSave({ ...config, enabled });
                            }}
                        />
                    }
                    label="Zobrazit statistiky jako záložku na info stránce"
                />

                {config.enabled && (
                    <>
                        {config.stats.length === 0 && !editingStat && (
                            <Typography color="text.secondary" sx={{ py: 1 }}>
                                Zatím nejsou přidány žádné statistiky.
                            </Typography>
                        )}

                        {config.stats.map((stat) => {
                            if (editingStat && !isNewStat && editingStat.id === stat.id) {
                                return (
                                    <Card key={stat.id} variant="outlined" sx={{ borderColor: "primary.main" }}>
                                        <CardContent>
                                            <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                Upravit statistiku
                                            </Typography>

                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                <FormControl size="small" fullWidth required>
                                                    <InputLabel>Sledovaná pole</InputLabel>
                                                    <Select
                                                        multiple
                                                        value={editingStat.fieldIds}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setEditingStat((prev) => prev ? {
                                                                ...prev,
                                                                fieldIds: typeof value === "string" ? value.split(",") : value,
                                                            } : prev);
                                                        }}
                                                        label="Sledovaná pole"
                                                        renderValue={(selected) =>
                                                            selected.map((fid) => getFieldLabel(fid)).join(", ")
                                                        }
                                                    >
                                                        {optionFields.map((field) => (
                                                            <MenuItem key={field.id} value={field.id}>
                                                                <Checkbox checked={editingStat.fieldIds.includes(field.id)} />
                                                                <ListItemText primary={field.label} />
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>

                                                <TextField
                                                    size="small"
                                                    label="Vlastní název (nepovinné)"
                                                    value={editingStat.name ?? ""}
                                                    onChange={(e) => setEditingStat((prev) => prev ? { ...prev, name: e.target.value || undefined } : prev)}
                                                    placeholder={editingStat.fieldIds.length > 0 ? editingStat.fieldIds.map((fid) => getFieldLabel(fid)).join(" / ") : ""}
                                                    fullWidth
                                                />

                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={editingStat.showPeople}
                                                            onChange={(e) => setEditingStat((prev) => prev ? {
                                                                ...prev,
                                                                showPeople: e.target.checked,
                                                                personFieldId: e.target.checked ? prev.personFieldId : undefined,
                                                            } : prev)}
                                                        />
                                                    }
                                                    label="Zobrazit seznam osob"
                                                />

                                                {editingStat.showPeople && (
                                                    <FormControl size="small" fullWidth required>
                                                        <InputLabel>Pole pro jméno osoby</InputLabel>
                                                        <Select
                                                            value={editingStat.personFieldId ?? ""}
                                                            onChange={(e) => setEditingStat((prev) => prev ? {
                                                                ...prev,
                                                                personFieldId: e.target.value || undefined,
                                                            } : prev)}
                                                            label="Pole pro jméno osoby"
                                                        >
                                                            <MenuItem value="">
                                                                <em>Nevybráno</em>
                                                            </MenuItem>
                                                            {allInputFields.map((field) => (
                                                                <MenuItem key={field.id} value={field.id}>
                                                                    {field.label}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                )}

                                                <Box sx={{ display: "flex", gap: 1 }}>
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<Check />}
                                                        onClick={handleConfirmEdit}
                                                        disabled={editingStat.fieldIds.length === 0 || (editingStat.showPeople && !editingStat.personFieldId) || saving}
                                                    >
                                                        Potvrdit
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<Close />}
                                                        onClick={handleCancelEdit}
                                                    >
                                                        Zrušit
                                                    </Button>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                );
                            }

                            const displayName = stat.name?.trim() || stat.fieldIds.map((fid) => getFieldLabel(fid)).join(" / ");

                            return (
                                <Card key={stat.id} variant="outlined">
                                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                            <Typography variant="subtitle2">
                                                {displayName}
                                            </Typography>
                                            <Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditStat(stat)}
                                                    disabled={editingStat !== null || saving}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteStat(stat.id)}
                                                    disabled={editingStat !== null || saving}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {editingStat && isNewStat && (
                            <Card variant="outlined" sx={{ borderColor: "primary.main" }}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                        {isNewStat ? "Nová statistika" : "Upravit statistiku"}
                                    </Typography>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <FormControl size="small" fullWidth required>
                                            <InputLabel>Sledovaná pole</InputLabel>
                                            <Select
                                                multiple
                                                value={editingStat.fieldIds}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setEditingStat((prev) => prev ? {
                                                        ...prev,
                                                        fieldIds: typeof value === "string" ? value.split(",") : value,
                                                    } : prev);
                                                }}
                                                label="Sledovaná pole"
                                                renderValue={(selected) =>
                                                    selected.map((fid) => getFieldLabel(fid)).join(", ")
                                                }
                                            >
                                                {optionFields.map((field) => (
                                                    <MenuItem key={field.id} value={field.id}>
                                                        <Checkbox checked={editingStat.fieldIds.includes(field.id)} />
                                                        <ListItemText primary={field.label} />
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            size="small"
                                            label="Vlastní název (nepovinné)"
                                            value={editingStat.name ?? ""}
                                            onChange={(e) => setEditingStat((prev) => prev ? { ...prev, name: e.target.value || undefined } : prev)}
                                            placeholder={editingStat.fieldIds.length > 0 ? editingStat.fieldIds.map((fid) => getFieldLabel(fid)).join(" / ") : ""}
                                            fullWidth
                                        />

                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={editingStat.showPeople}
                                                    onChange={(e) => setEditingStat((prev) => prev ? {
                                                        ...prev,
                                                        showPeople: e.target.checked,
                                                        personFieldId: e.target.checked ? prev.personFieldId : undefined,
                                                    } : prev)}
                                                />
                                            }
                                            label="Zobrazit seznam osob"
                                        />

                                        {editingStat.showPeople && (
                                            <FormControl size="small" fullWidth required>
                                                <InputLabel>Pole pro jméno osoby</InputLabel>
                                                <Select
                                                    value={editingStat.personFieldId ?? ""}
                                                    onChange={(e) => setEditingStat((prev) => prev ? {
                                                        ...prev,
                                                        personFieldId: e.target.value || undefined,
                                                    } : prev)}
                                                    label="Pole pro jméno osoby"
                                                >
                                                    <MenuItem value="">
                                                        <em>Nevybráno</em>
                                                    </MenuItem>
                                                    {allInputFields.map((field) => (
                                                        <MenuItem key={field.id} value={field.id}>
                                                            {field.label}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        )}

                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button
                                                size="small"
                                                variant="contained"
                                                startIcon={<Check />}
                                                onClick={handleConfirmEdit}
                                                disabled={editingStat.fieldIds.length === 0 || (editingStat.showPeople && !editingStat.personFieldId) || saving}
                                            >
                                                {isNewStat ? "Přidat" : "Potvrdit"}
                                            </Button>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<Close />}
                                                onClick={handleCancelEdit}
                                            >
                                                Zrušit
                                            </Button>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        )}

                    </>
                )}
            </Box>
        </Box>
    );
}
