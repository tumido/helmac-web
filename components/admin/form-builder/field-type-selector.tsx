"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    Typography,
    Grid,
    Card,
    CardActionArea,
    CardContent,
    Box,
} from "@mui/material";
import { FieldType, FIELD_TYPE_META } from "@/lib/types/registration-form";
import { FIELD_TYPE_ICONS } from "./field-type-icons";

interface FieldTypeSelectorProps {
    open: boolean;
    onClose: () => void;
    onSelect: (type: FieldType) => void;
}

export function FieldTypeSelector({ open, onClose, onSelect }: FieldTypeSelectorProps) {
    const inputTypes = Object.entries(FIELD_TYPE_META).filter(([, meta]) => meta.group === "input");
    const layoutTypes = Object.entries(FIELD_TYPE_META).filter(([, meta]) => meta.group === "layout");

    const handleSelect = (type: FieldType) => {
        onSelect(type);
        onClose();
    };

    return (
        <Dialog open={open} maxWidth="sm" fullWidth>
            <DialogTitle>Přidat pole</DialogTitle>
            <DialogContent>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Vstupní pole
                </Typography>
                <Grid container spacing={1} sx={{ mb: 3 }}>
                    {inputTypes.map(([type, meta]) => (
                        <Grid item xs={6} sm={4} key={type}>
                            <Card variant="outlined">
                                <CardActionArea onClick={() => handleSelect(type as FieldType)}>
                                    <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                                        <Box sx={{ color: "primary.main", mb: 0.5 }}>
                                            {FIELD_TYPE_ICONS[meta.icon]}
                                        </Box>
                                        <Typography variant="body2">{meta.label}</Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Rozložení
                </Typography>
                <Grid container spacing={1}>
                    {layoutTypes.map(([type, meta]) => (
                        <Grid item xs={6} sm={4} key={type}>
                            <Card variant="outlined">
                                <CardActionArea onClick={() => handleSelect(type as FieldType)}>
                                    <CardContent sx={{ textAlign: "center", py: 1.5 }}>
                                        <Box sx={{ color: "text.secondary", mb: 0.5 }}>
                                            {FIELD_TYPE_ICONS[meta.icon]}
                                        </Box>
                                        <Typography variant="body2">{meta.label}</Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    );
}
