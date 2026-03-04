"use client";

import { Paper, Typography, Button, Box, CircularProgress } from "@mui/material";
import {
    Visibility,
    VisibilityOff,
    Delete,
    Close,
} from "@mui/icons-material";

interface BulkActionBarProps {
    selectedCount: number;
    onPublish?: () => void;
    onUnpublish?: () => void;
    onDelete?: () => void;
    onClear: () => void;
    loading?: boolean;
    showPublishActions?: boolean;
}

export function BulkActionBar({
    selectedCount,
    onPublish,
    onUnpublish,
    onDelete,
    onClear,
    loading = false,
    showPublishActions = true,
}: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <Paper
            elevation={3}
            sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2,
                display: "flex",
                alignItems: "center",
                gap: { xs: 1, sm: 2 },
                flexWrap: "wrap",
                backgroundColor: "primary.50",
                borderLeft: 4,
                borderColor: "primary.main",
            }}
        >
            <Typography
                fontWeight="medium"
                sx={{ minWidth: { xs: "auto", sm: 100 } }}
            >
                {selectedCount} vybráno
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    flex: 1,
                    flexWrap: "wrap",
                }}
            >
                {showPublishActions && onPublish && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={loading ? <CircularProgress size={16} /> : <Visibility />}
                        onClick={onPublish}
                        disabled={loading}
                        sx={{
                            "& .MuiButton-startIcon": {
                                display: { xs: "none", sm: "inherit" },
                            },
                        }}
                    >
                        Publikovat
                    </Button>
                )}

                {showPublishActions && onUnpublish && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={loading ? <CircularProgress size={16} /> : <VisibilityOff />}
                        onClick={onUnpublish}
                        disabled={loading}
                        sx={{
                            "& .MuiButton-startIcon": {
                                display: { xs: "none", sm: "inherit" },
                            },
                        }}
                    >
                        Skrýt
                    </Button>
                )}

                {onDelete && (
                    <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
                        onClick={onDelete}
                        disabled={loading}
                        sx={{
                            "& .MuiButton-startIcon": {
                                display: { xs: "none", sm: "inherit" },
                            },
                        }}
                    >
                        Smazat
                    </Button>
                )}
            </Box>

            <Button
                size="small"
                variant="text"
                startIcon={<Close />}
                onClick={onClear}
                disabled={loading}
                sx={{
                    "& .MuiButton-startIcon": {
                        display: { xs: "none", sm: "inherit" },
                    },
                }}
            >
                Zrušit
            </Button>
        </Paper>
    );
}
