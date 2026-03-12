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
    InputLabel,
    MenuItem,
    Select,
    Switch,
    Typography,
} from "@mui/material";
import { Edit, Save } from "@mui/icons-material";
import type { InfoStatsConfig, InputField, OptionCounts } from "@/lib/types/registration-form";
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
    fieldIds: [],
    showPeople: false,
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

export function InfoStatsEditor({
    yearId,
    infoStatsConfig: initialConfig,
    allInputFields,
    optionFields,
    optionCounts,
}: InfoStatsEditorProps) {
    const [config, setConfig] = useState<InfoStatsConfig>(initialConfig ?? defaultConfig);
    const [saved, setSaved] = useState<InfoStatsConfig>(initialConfig ?? defaultConfig);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleToggleField = (fieldId: string) => {
        setConfig((prev) => ({
            ...prev,
            fieldIds: prev.fieldIds.includes(fieldId)
                ? prev.fieldIds.filter((id) => id !== fieldId)
                : [...prev.fieldIds, fieldId],
        }));
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
            setEditing(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    const handleCancel = () => {
        setConfig(saved);
        setEditing(false);
        setError(null);
    };

    const getFieldById = (fieldId: string) => {
        return optionFields.find((f) => f.id === fieldId);
    };

    const getFieldLabel = (fieldId: string) => {
        return optionFields.find((f) => f.id === fieldId)?.label ?? "(neznámé pole)";
    };

    // --- Read-only view ---
    if (!editing) {
        return (
            <Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6">
                        Statistiky na info stránce
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => setEditing(true)}
                        size="small"
                    >
                        Upravit
                    </Button>
                </Box>

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Nastavení bylo uloženo
                    </Alert>
                )}

                {!saved.enabled ? (
                    <Typography color="text.secondary" sx={{ py: 1 }}>
                        Statistiky na info stránce jsou vypnuty.
                    </Typography>
                ) : saved.fieldIds.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 1 }}>
                        Statistiky jsou zapnuty, ale žádná pole nejsou vybrána.
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {saved.fieldIds.map((fieldId) => {
                            const field = getFieldById(fieldId);
                            return (
                                <Card key={fieldId} variant="outlined">
                                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                            {getFieldLabel(fieldId)}
                                        </Typography>
                                        {field ? (
                                            <OptionCountsList field={field} optionCounts={optionCounts} />
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Pole nebylo nalezeno
                                            </Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {saved.showPeople && saved.personFieldId && (
                            <Typography variant="body2" color="text.secondary">
                                Zobrazení osob: {allInputFields.find((f) => f.id === saved.personFieldId)?.label ?? "(neznámé pole)"}
                            </Typography>
                        )}
                    </Box>
                )}
            </Box>
        );
    }

    // --- Edit mode ---
    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6">
                    Statistiky na info stránce
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                        variant="outlined"
                        onClick={handleCancel}
                        size="small"
                    >
                        Zrušit
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
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
                        <Typography variant="subtitle2">
                            Sledovaná pole
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: -1.5 }}>
                            Vyberte pole, jejichž počty se zobrazí ve statistikách.
                        </Typography>

                        {optionFields.length === 0 ? (
                            <Alert severity="info">
                                Formulář neobsahuje žádná pole s možnostmi (výběr, přepínač, cenový výběr).
                            </Alert>
                        ) : (
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                {optionFields.map((field) => (
                                    <Box key={field.id}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={config.fieldIds.includes(field.id)}
                                                    onChange={() => handleToggleField(field.id)}
                                                />
                                            }
                                            label={field.label}
                                        />
                                        {config.fieldIds.includes(field.id) && (
                                            <Box sx={{ ml: 4, mb: 1 }}>
                                                <OptionCountsList field={field} optionCounts={optionCounts} />
                                            </Box>
                                        )}
                                    </Box>
                                ))}
                            </Box>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={config.showPeople}
                                    onChange={(e) => setConfig((prev) => ({ ...prev, showPeople: e.target.checked }))}
                                />
                            }
                            label="Zobrazit seznam osob u každé možnosti"
                        />

                        {config.showPeople && (
                            <FormControl size="small" sx={{ maxWidth: 300 }}>
                                <InputLabel>Pole pro jméno osoby</InputLabel>
                                <Select
                                    value={config.personFieldId ?? ""}
                                    onChange={(e) => setConfig((prev) => ({
                                        ...prev,
                                        personFieldId: e.target.value || undefined,
                                    }))}
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
                    </>
                )}
            </Box>
        </Box>
    );
}
