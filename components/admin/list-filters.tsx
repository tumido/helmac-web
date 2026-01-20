"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Box,
    TextField,
    Select,
    MenuItem,
    InputAdornment,
    FormControl,
    InputLabel,
} from "@mui/material";
import { Search, Clear } from "@mui/icons-material";
import { useDebouncedCallback } from "use-debounce";

interface Year {
    id: string;
    year: number;
    title: string;
}

interface ListFiltersProps {
    showYearFilter?: boolean;
    showStatusFilter?: boolean;
    years?: Year[];
    searchPlaceholder?: string;
}

export function ListFilters({
    showYearFilter = false,
    showStatusFilter = false,
    years = [],
    searchPlaceholder = "Hledat...",
}: ListFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

    const updateFilter = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.push(`?${params.toString()}`);
        },
        [router, searchParams]
    );

    const debouncedSearch = useDebouncedCallback((value: string) => {
        updateFilter("q", value);
    }, 300);

    const handleSearchChange = (value: string) => {
        setSearchValue(value);
        debouncedSearch(value);
    };

    const clearSearch = () => {
        setSearchValue("");
        updateFilter("q", "");
    };

    // Sync search value with URL params
    useEffect(() => {
        const urlSearch = searchParams.get("q") ?? "";
        if (urlSearch !== searchValue) {
            setSearchValue(urlSearch);
        }
    }, [searchParams]);

    return (
        <Box
            sx={{
                display: "flex",
                gap: 2,
                mb: 3,
                flexWrap: "wrap",
            }}
        >
            <TextField
                placeholder={searchPlaceholder}
                size="small"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: searchValue ? (
                        <InputAdornment position="end">
                            <Clear
                                sx={{ cursor: "pointer", fontSize: 20 }}
                                onClick={clearSearch}
                            />
                        </InputAdornment>
                    ) : null,
                }}
                sx={{
                    flex: { xs: "1 1 100%", sm: "0 1 auto" },
                    minWidth: { xs: "100%", sm: 250 },
                }}
            />

            {showYearFilter && years.length > 0 && (
                <FormControl
                    size="small"
                    sx={{
                        flex: { xs: "1 1 45%", sm: "0 1 auto" },
                        minWidth: { xs: "45%", sm: 150 },
                    }}
                >
                    <InputLabel>Rocnik</InputLabel>
                    <Select
                        label="Rocnik"
                        value={searchParams.get("yearId") ?? ""}
                        onChange={(e) => updateFilter("yearId", e.target.value)}
                    >
                        <MenuItem value="">Vsechny rocniky</MenuItem>
                        {years.map((year) => (
                            <MenuItem key={year.id} value={year.id}>
                                {year.year} - {year.title}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {showStatusFilter && (
                <FormControl
                    size="small"
                    sx={{
                        flex: { xs: "1 1 45%", sm: "0 1 auto" },
                        minWidth: { xs: "45%", sm: 140 },
                    }}
                >
                    <InputLabel>Stav</InputLabel>
                    <Select
                        label="Stav"
                        value={searchParams.get("status") ?? ""}
                        onChange={(e) => updateFilter("status", e.target.value)}
                    >
                        <MenuItem value="">Vsechny</MenuItem>
                        <MenuItem value="published">Publikovane</MenuItem>
                        <MenuItem value="draft">Skryte</MenuItem>
                    </Select>
                </FormControl>
            )}
        </Box>
    );
}
