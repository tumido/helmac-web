"use client";

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";

const ITEM_STATUS_CONFIG: Record<
    string,
    { label: string; color: "default" | "success" | "error" }
> = {
    sent: { label: "Odesláno", color: "success" },
    failed: { label: "Neúspěšné", color: "error" },
    pending: { label: "Ve frontě", color: "default" },
    sending: { label: "Ve frontě", color: "default" },
};

interface RecipientItem {
    id: string;
    recipient: string;
    status: string;
    sentAt: string | null;
}

interface MassEmailRecipientListProps {
    items: RecipientItem[];
}

export function MassEmailRecipientList({ items }: MassEmailRecipientListProps) {
    return (
        <Accordion variant="outlined" disableGutters>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>Příjemci ({items.length})</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Příjemce</TableCell>
                            <TableCell>Stav</TableCell>
                            <TableCell>Odesláno</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => {
                            const statusConfig = ITEM_STATUS_CONFIG[
                                item.status
                            ] ?? {
                                label: item.status,
                                color: "default" as const,
                            };
                            return (
                                <TableRow key={item.id}>
                                    <TableCell>{item.recipient}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            label={statusConfig.label}
                                            color={statusConfig.color}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {item.sentAt ?? "—"}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </AccordionDetails>
        </Accordion>
    );
}
