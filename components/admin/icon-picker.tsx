"use client";

import { useState, useMemo } from "react";
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Chip,
    IconButton,
    Typography,
    InputAdornment,
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";
import { GameIcon, GAME_ICONS, ICON_CATEGORIES } from "@/lib/icons";

interface IconPickerProps {
    value: string | null;
    onChange: (icon: string | null) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<string | null>(null);

    const filtered = useMemo(() => {
        return GAME_ICONS.filter((icon) => {
            if (category && icon.category !== category) return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    icon.label.toLowerCase().includes(q) ||
                    icon.name.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [search, category]);

    const handleSelect = (name: string) => {
        onChange(name);
        setOpen(false);
    };

    const handleClear = () => {
        onChange(null);
        setOpen(false);
    };

    return (
        <>
            <Button
                variant="outlined"
                size="small"
                onClick={() => setOpen(true)}
                startIcon={
                    value ? (
                        <GameIcon
                            name={value}
                            sx={{ fontSize: "1.2em" }}
                        />
                    ) : undefined
                }
                sx={{ textTransform: "none" }}
            >
                {value ? "Změnit ikonu" : "Vybrat ikonu"}
            </Button>
            <input
                type="hidden"
                name="icon"
                value={value || ""}
            />

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    Vybrat ikonu
                    <IconButton
                        onClick={() => setOpen(false)}
                        size="small"
                    >
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        placeholder="Hledat..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            mb: 2,
                        }}
                    >
                        <Chip
                            label="Vše"
                            size="small"
                            variant={
                                category === null
                                    ? "filled"
                                    : "outlined"
                            }
                            onClick={() => setCategory(null)}
                        />
                        {ICON_CATEGORIES.map((cat) => (
                            <Chip
                                key={cat}
                                label={cat}
                                size="small"
                                variant={
                                    category === cat
                                        ? "filled"
                                        : "outlined"
                                }
                                onClick={() => setCategory(cat)}
                            />
                        ))}
                    </Box>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(80px, 1fr))",
                            gap: 1,
                            maxHeight: 400,
                            overflowY: "auto",
                        }}
                    >
                        {filtered.map((icon) => (
                            <Box
                                key={icon.name}
                                onClick={() => handleSelect(icon.name)}
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 0.5,
                                    p: 1,
                                    borderRadius: 1,
                                    cursor: "pointer",
                                    border: "2px solid",
                                    borderColor:
                                        value === icon.name
                                            ? "primary.main"
                                            : "transparent",
                                    "&:hover": {
                                        backgroundColor:
                                            "action.hover",
                                    },
                                }}
                            >
                                <GameIcon
                                    name={icon.name}
                                    sx={{ fontSize: 32 }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        textAlign: "center",
                                        lineHeight: 1.2,
                                        fontSize: "0.65rem",
                                    }}
                                >
                                    {icon.label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    {value && (
                        <Button
                            onClick={handleClear}
                            color="error"
                            size="small"
                        >
                            Odebrat ikonu
                        </Button>
                    )}
                    <Button
                        onClick={() => setOpen(false)}
                        size="small"
                    >
                        Zrušit
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
