"use client";

import { useState } from "react";
import {
    Box,
    ButtonBase,
    IconButton,
    Tooltip,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    CircularProgress,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { SortableList } from "@/components/admin/sortable-list";
import { HomepageStepForm } from "@/components/admin/homepage-step-form";
import { GameIcon } from "@/lib/icons";
import {
    deleteHomepageStep,
    reorderHomepageSteps,
} from "@/lib/actions/homepage-steps";
import { useToast } from "@/lib/hooks/use-toast";
import { useRouter } from "next/navigation";
import { builderPalette as p } from "@/components/admin/email-builder/palette";

interface Step {
    id: string;
    title: string;
    description: string;
    icon: string;
}

interface HomepageStepsListProps {
    yearId: string;
    steps: Step[];
}

export function HomepageStepsList({
    yearId,
    steps,
}: HomepageStepsListProps) {
    const toast = useToast();
    const router = useRouter();
    const [formOpen, setFormOpen] = useState(false);
    const [editStep, setEditStep] = useState<Step | null>(
        null
    );
    const [deleteTarget, setDeleteTarget] =
        useState<Step | null>(null);
    const [deleting, setDeleting] = useState(false);

    const handleReorder = async (newOrder: string[]) => {
        const result = await reorderHomepageSteps(
            yearId,
            newOrder
        );
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Pořadí kroků bylo změněno");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const result = await deleteHomepageStep(
            deleteTarget.id
        );
        setDeleting(false);
        setDeleteTarget(null);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Krok byl smazán");
            router.refresh();
        }
    };

    return (
        <>
            <Box
                sx={{
                    backgroundColor: p.surface,
                    border: `1px solid ${p.line}`,
                    borderRadius: "14px",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* head */}
                <Box
                    sx={{
                        px: 2,
                        py: 1.5,
                        borderBottom: `1px solid ${p.line}`,
                        background: `linear-gradient(180deg, ${p.surface}, ${p.surface2})`,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: 11,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                            color: p.ink3,
                            fontWeight: 700,
                            flex: 1,
                        }}
                        noWrap
                    >
                        Kroky na úvodní stránce
                    </Typography>
                    <Box
                        sx={{
                            fontFamily:
                                "'JetBrains Mono', monospace",
                            fontSize: 11,
                            color: p.ink2,
                            backgroundColor: p.surface3,
                            px: "7px",
                            py: "2px",
                            borderRadius: "6px",
                        }}
                    >
                        {steps.length}
                    </Box>
                </Box>

                {/* body */}
                <Box
                    sx={{
                        flex: 1,
                        p: "8px",
                        backgroundColor: p.surface2,
                        minHeight: 48,
                    }}
                >
                    {steps.length === 0 ? (
                        <Typography
                            sx={{
                                fontSize: 12.5,
                                color: p.ink3,
                                textAlign: "center",
                                py: 3,
                            }}
                        >
                            Žádné kroky
                        </Typography>
                    ) : (
                        <SortableList
                            items={steps}
                            getId={(s) => s.id}
                            onReorder={handleReorder}
                            renderItem={(step) => (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems:
                                            "center",
                                        gap: 1.5,
                                        flex: 1,
                                        py: 0.75,
                                        pr: 1,
                                    }}
                                >
                                    <GameIcon
                                        name={step.icon}
                                        sx={{
                                            color: p.ink3,
                                            fontSize: 18,
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        <Typography
                                            sx={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: p.ink,
                                            }}
                                            noWrap
                                        >
                                            {step.title}
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 12,
                                                color: p.ink3,
                                            }}
                                            noWrap
                                        >
                                            {
                                                step.description
                                            }
                                        </Typography>
                                    </Box>
                                    <Box
                                        sx={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap: 0.25,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Tooltip title="Upravit">
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    setEditStep(
                                                        step
                                                    )
                                                }
                                                sx={{
                                                    color: p.ink3,
                                                    "&:hover":
                                                        {
                                                            color: p.indigo,
                                                        },
                                                }}
                                            >
                                                <Edit
                                                    sx={{
                                                        fontSize: 16,
                                                    }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Smazat">
                                            <IconButton
                                                size="small"
                                                onClick={() =>
                                                    setDeleteTarget(
                                                        step
                                                    )
                                                }
                                                sx={{
                                                    color: p.ink3,
                                                    "&:hover":
                                                        {
                                                            color: p.negInk,
                                                        },
                                                }}
                                            >
                                                <Delete
                                                    sx={{
                                                        fontSize: 16,
                                                    }}
                                                />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </Box>
                            )}
                        />
                    )}
                </Box>

                {/* foot */}
                <Box
                    sx={{
                        p: "10px",
                        borderTop: `1px solid ${p.line}`,
                        backgroundColor: p.surface2,
                    }}
                >
                    <ButtonBase
                        onClick={() => setFormOpen(true)}
                        sx={{
                            width: "100%",
                            py: "10px",
                            px: "12px",
                            backgroundColor: p.surface,
                            border: `1px dashed ${p.line}`,
                            borderRadius: "10px",
                            color: p.indigo,
                            fontSize: 13,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 140ms ease",
                            "&:hover": {
                                borderColor: p.indigo,
                                backgroundColor:
                                    p.indigoSoft,
                            },
                        }}
                    >
                        <Add sx={{ fontSize: 16 }} />
                        Přidat krok
                    </ButtonBase>
                </Box>
            </Box>

            {/* Create dialog */}
            {formOpen && (
                <HomepageStepForm
                    mode="create"
                    yearId={yearId}
                    open={formOpen}
                    onClose={() => setFormOpen(false)}
                />
            )}

            {/* Edit dialog */}
            {editStep && (
                <HomepageStepForm
                    mode="edit"
                    yearId={yearId}
                    stepId={editStep.id}
                    defaultValues={{
                        title: editStep.title,
                        description: editStep.description,
                        icon: editStep.icon,
                    }}
                    open={!!editStep}
                    onClose={() => setEditStep(null)}
                />
            )}

            {/* Delete confirmation */}
            <Dialog
                open={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
            >
                <DialogTitle>Smazat krok?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Opravdu chcete smazat krok &ldquo;
                        {deleteTarget?.title}&rdquo;?
                        <br />
                        Tato akce je nevratná.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() =>
                            setDeleteTarget(null)
                        }
                    >
                        Zrušit
                    </Button>
                    <Button
                        onClick={handleDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        startIcon={
                            deleting ? (
                                <CircularProgress
                                    size={16}
                                    color="inherit"
                                />
                            ) : null
                        }
                    >
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
