"use client";

import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import { Add, Check, Close, Delete, Edit, Save } from "@mui/icons-material";
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

function OptionCountsList({ field, optionCounts }: { field: InputField; optionCounts?: OptionCounts }) {
    const options = field.options && field.options.length > 0
        ? field.options
        : optionCounts?.[field.name] ? Object.keys(optionCounts[field.name]) : [];

    if (options.length === 0) return null;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
            {options.map((option) => {
                const count = optionCounts?.[field.name]?.[option] ?? 0;
                return (
                    <Box
                        key={option}
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            px: 1,
                            py: 0.25,
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {option}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                            {count}&times;
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}

function createNewStat(): InfoStatItem {
    return {
        id: crypto.randomUUID(),
        fieldId: "",
        showPeople: false,
    };
}

export function InfoStatsEditor({
    yearId,
    infoStatsConfig: initialConfig,
    allInputFields,
    optionFields,
    optionCounts,
}: InfoStatsEditorProps) {
    const [config, setConfig] = useState<InfoStatsConfig>(initialConfig ?? defaultConfig);
    const [saved, setSaved] = useState<InfoStatsConfig>(initialConfig ?? defaultConfig);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [editingStat, setEditingStat] = useState<InfoStatItem | null>(null);
    const [isNewStat, setIsNewStat] = useState(false);

    const isDirty = JSON.stringify(config) !== JSON.stringify(saved);

    const getOptionFieldById = (fieldId: string) => {
        return optionFields.find((f) => f.id === fieldId);
    };

    const getFieldLabel = (fieldId: string) => {
        return optionFields.find((f) => f.id === fieldId)?.label
            ?? allInputFields.find((f) => f.id === fieldId)?.label
            ?? "(neznámé pole)";
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const result = await saveInfoStatsConfig(yearId, config);

        if (result.error) {
            setError(result.error);
        } else {
            setSaved(config);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    const handleCancel = () => {
        setConfig(saved);
        setEditingStat(null);
        setIsNewStat(false);
        setError(null);
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
        setConfig((prev) => ({
            ...prev,
            stats: prev.stats.filter((s) => s.id !== statId),
        }));
        if (editingStat?.id === statId) {
            setEditingStat(null);
            setIsNewStat(false);
        }
    };

    const handleConfirmEdit = () => {
        if (!editingStat || !editingStat.fieldId) return;

        setConfig((prev) => {
            if (isNewStat) {
                return { ...prev, stats: [...prev.stats, editingStat] };
            }
            return {
                ...prev,
                stats: prev.stats.map((s) => s.id === editingStat.id ? editingStat : s),
            };
        });
        setEditingStat(null);
        setIsNewStat(false);
    };

    const handleCancelEdit = () => {
        setEditingStat(null);
        setIsNewStat(false);
    };

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">
                    Statistiky na info stránce
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    {isDirty && (
                        <Button
                            variant="outlined"
                            onClick={handleCancel}
                            size="small"
                        >
                            Zrušit
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving || !isDirty}
                        size="small"
                    >
                        {saving ? "Ukládám..." : "Uložit"}
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Nastavení bylo uloženo
                </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={config.enabled}
                            onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))}
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
                            const field = getOptionFieldById(stat.fieldId);
                            const displayName = stat.name?.trim() || getFieldLabel(stat.fieldId);

                            return (
                                <Card key={stat.id} variant="outlined">
                                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                                            <Typography variant="subtitle2">
                                                {displayName}
                                            </Typography>
                                            <Box>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEditStat(stat)}
                                                    disabled={editingStat !== null}
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteStat(stat.id)}
                                                    disabled={editingStat !== null}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        {field ? (
                                            <OptionCountsList field={field} optionCounts={optionCounts} />
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Pole nebylo nalezeno
                                            </Typography>
                                        )}
                                        {stat.showPeople && stat.personFieldId && (
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                Zobrazení osob: {getFieldLabel(stat.personFieldId)}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {editingStat && (
                            <Card variant="outlined" sx={{ borderColor: "primary.main" }}>
                                <CardContent>
                                    <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                        {isNewStat ? "Nová statistika" : "Upravit statistiku"}
                                    </Typography>

                                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                        <FormControl size="small" fullWidth required>
                                            <InputLabel>Sledované pole</InputLabel>
                                            <Select
                                                value={editingStat.fieldId}
                                                onChange={(e) => setEditingStat((prev) => prev ? { ...prev, fieldId: e.target.value } : prev)}
                                                label="Sledované pole"
                                            >
                                                {optionFields.map((field) => (
                                                    <MenuItem
                                                        key={field.id}
                                                        value={field.id}
                                                        disabled={config.stats.some((s) => s.fieldId === field.id && s.id !== editingStat.id)}
                                                    >
                                                        {field.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

                                        <TextField
                                            size="small"
                                            label="Vlastní název (nepovinné)"
                                            value={editingStat.name ?? ""}
                                            onChange={(e) => setEditingStat((prev) => prev ? { ...prev, name: e.target.value || undefined } : prev)}
                                            placeholder={editingStat.fieldId ? getFieldLabel(editingStat.fieldId) : ""}
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
                                                disabled={!editingStat.fieldId || (editingStat.showPeople && !editingStat.personFieldId)}
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

                        {!editingStat && (
                            <Button
                                variant="outlined"
                                startIcon={<Add />}
                                onClick={handleAddStat}
                                sx={{ alignSelf: "flex-start" }}
                            >
                                Přidat statistiku
                            </Button>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}
