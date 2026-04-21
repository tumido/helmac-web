"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Autocomplete,
    Box,
    Chip,
    TextField,
    Typography,
} from "@mui/material";
import { FilterList, Close } from "@mui/icons-material";

interface FilterableField {
    name: string;
    label: string;
    type: string;
    options: string[];
}

interface FieldValueFilterProps {
    basePath: string;
    fields: FilterableField[];
    activeField: string | null;
    activeValue: string | null;
    otherParams: string;
}

export function FieldValueFilter({
    basePath,
    fields,
    activeField,
    activeValue,
    otherParams,
}: FieldValueFilterProps) {
    const router = useRouter();
    const [pendingField, setPendingField] = useState<FilterableField | null>(null);

    const confirmedField = activeField
        ? fields.find((f) => f.name === activeField) ?? null
        : null;

    // Show the pending (local) selection, or the confirmed one from URL
    const selectedField = pendingField ?? confirmedField;

    const navigate = (field: string | null, value: string | null) => {
        const params = [
            otherParams,
            ...(field && value
                ? [`field=${encodeURIComponent(field)}`, `value=${encodeURIComponent(value)}`]
                : []),
        ].filter(Boolean).join("&");
        const url = params ? `${basePath}?${params}` : basePath;
        router.push(url);
    };

    const handleFieldChange = (_: unknown, field: FilterableField | null) => {
        if (!field) {
            setPendingField(null);
            navigate(null, null);
            return;
        }
        // If only one option, navigate immediately
        if (field.options.length === 1) {
            setPendingField(null);
            navigate(field.name, field.options[0]);
            return;
        }
        // Store field locally until value is picked
        setPendingField(field);
    };

    const handleValueChange = (_: unknown, value: string | null) => {
        if (!selectedField || !value) {
            return;
        }
        setPendingField(null);
        navigate(selectedField.name, value);
    };

    const handleClear = () => {
        setPendingField(null);
        navigate(null, null);
    };

    // When a filter is active, show it as a compact chip
    if (confirmedField && activeValue) {
        return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <FilterList fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                    Filtr:
                </Typography>
                <Chip
                    label={`${confirmedField.label}: ${activeValue}`}
                    onDelete={handleClear}
                    deleteIcon={<Close />}
                    color="primary"
                    size="small"
                    variant="outlined"
                />
            </Box>
        );
    }

    // When no filter is active, show the two dropdowns
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <FilterList fontSize="small" color="action" />
            <Autocomplete
                size="small"
                options={fields}
                getOptionLabel={(f) => f.label}
                renderOption={(props, option) => (
                    <li {...props} key={option.name}>
                        {option.label}
                    </li>
                )}
                value={selectedField}
                onChange={handleFieldChange}
                renderInput={(params) => (
                    <TextField {...params} placeholder="Filtrovat dle pole..." />
                )}
                sx={{ minWidth: 220 }}
                noOptionsText="Žádná pole"
                isOptionEqualToValue={(option, value) => option.name === value.name}
            />
            {selectedField && (
                <Autocomplete
                    size="small"
                    options={selectedField.options}
                    value={null}
                    onChange={handleValueChange}
                    renderInput={(params) => (
                        <TextField {...params} placeholder="Vyberte hodnotu..." />
                    )}
                    sx={{ minWidth: 220 }}
                    noOptionsText="Žádné hodnoty"
                    openOnFocus
                />
            )}
        </Box>
    );
}
