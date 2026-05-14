"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Typography,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { YearForm } from "@/components/forms/year-form";
import { formatDate } from "@/lib/utils/date";
import { storageUrl } from "@/lib/utils/storage";

interface YearSettingsViewProps {
    yearId: string;
    defaultValues: {
        year?: number;
        title?: string;
        subtitle?: string | null;
        startDate?: Date | null;
        endDate?: Date | null;
        headerPhoto?: string | null;
        heroPhoto?: string | null;
    };
}

export function YearSettingsView({ yearId, defaultValues }: YearSettingsViewProps) {
    const [editing, setEditing] = useState(false);

    if (editing) {
        return (
            <YearForm
                mode="edit"
                yearId={yearId}
                defaultValues={defaultValues}
                onCancel={() => setEditing(false)}
            />
        );
    }

    return (
        <Card>
            <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Rok
                        </Typography>
                        <Typography variant="body1">
                            {defaultValues.year ?? "—"}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Název
                        </Typography>
                        <Typography variant="body1">
                            {defaultValues.title ?? "—"}
                        </Typography>
                    </Box>
                </Box>

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Podtitulek
                    </Typography>
                    <Typography variant="body1">
                        {defaultValues.subtitle || "—"}
                    </Typography>
                </Box>

                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                        gap: 2,
                    }}
                >
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Datum začátku
                        </Typography>
                        <Typography variant="body1">
                            {formatDate(defaultValues.startDate)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">
                            Datum konce
                        </Typography>
                        <Typography variant="body1">
                            {formatDate(defaultValues.endDate)}
                        </Typography>
                    </Box>
                </Box>

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Foto záhlaví podstránek
                    </Typography>
                    {defaultValues.headerPhoto ? (
                        <Box
                            component="img"
                            src={storageUrl(defaultValues.headerPhoto)}
                            alt="Foto záhlaví podstránek"
                            sx={{ display: "block", mt: 0.5, height: 120, objectFit: "cover", borderRadius: 1 }}
                        />
                    ) : (
                        <Typography variant="body1">Nenastaveno</Typography>
                    )}
                </Box>

                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Foto hlavní sekce
                    </Typography>
                    {defaultValues.heroPhoto ? (
                        <Box
                            component="img"
                            src={storageUrl(defaultValues.heroPhoto)}
                            alt="Foto hlavní sekce"
                            sx={{ display: "block", mt: 0.5, height: 120, objectFit: "cover", borderRadius: 1 }}
                        />
                    ) : (
                        <Typography variant="body1">Nenastaveno</Typography>
                    )}
                </Box>
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditing(true)}
                >
                    Upravit
                </Button>
            </CardActions>
        </Card>
    );
}
