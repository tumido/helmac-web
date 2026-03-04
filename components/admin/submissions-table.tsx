"use client";

import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Typography,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import type { FormField, InputField } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import type { RegistrationStatus } from "@prisma/client";

const STATUS_COLORS: Record<RegistrationStatus, "default" | "success" | "warning" | "error" | "info"> = {
    PENDING: "warning",
    CONFIRMED: "success",
    WAITLIST: "info",
    CANCELLED: "default",
    REJECTED: "error",
};

const STATUS_LABELS: Record<RegistrationStatus, string> = {
    PENDING: "Čeká",
    CONFIRMED: "Potvrzeno",
    WAITLIST: "Čekací listina",
    CANCELLED: "Zrušeno",
    REJECTED: "Zamítnuto",
};

interface Submission {
    id: string;
    data: unknown;
    status: RegistrationStatus;
    isPaid: boolean;
    paidAt: Date | null;
    createdAt: Date;
}

interface SubmissionsTableProps {
    submissions: Submission[];
    fields: FormField[];
    yearId: string;
    statusFilter: RegistrationStatus | null;
}

export function SubmissionsTable({ submissions, fields, yearId, statusFilter }: SubmissionsTableProps) {
    const router = useRouter();

    // Get first 4 input fields for column display
    const displayFields = fields
        .filter((f): f is InputField => isInputField(f))
        .slice(0, 4);

    const filtered = statusFilter
        ? submissions.filter((s) => s.status === statusFilter)
        : submissions;

    if (filtered.length === 0) {
        return (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                {statusFilter ? "Žádné registrace s tímto stavem" : "Zatím žádné registrace"}
            </Typography>
        );
    }

    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {displayFields.map((field) => (
                            <TableCell key={field.id}>{field.label}</TableCell>
                        ))}
                        <TableCell>Stav</TableCell>
                        <TableCell>Zaplaceno</TableCell>
                        <TableCell>Datum</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filtered.map((submission) => {
                        const data = submission.data as Record<string, unknown>;
                        return (
                            <TableRow
                                key={submission.id}
                                hover
                                sx={{ cursor: "pointer" }}
                                onClick={() =>
                                    router.push(`/admin/rocniky/${yearId}/registrace/${submission.id}`)
                                }
                            >
                                {displayFields.map((field) => (
                                    <TableCell key={field.id}>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                                            {String(data[field.name] ?? "")}
                                        </Typography>
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <Chip
                                        label={STATUS_LABELS[submission.status]}
                                        color={STATUS_COLORS[submission.status]}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    {submission.isPaid ? (
                                        <CheckCircle fontSize="small" color="success" />
                                    ) : (
                                        <Cancel fontSize="small" color="disabled" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" noWrap>
                                        {new Date(submission.createdAt).toLocaleDateString("cs-CZ")}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
