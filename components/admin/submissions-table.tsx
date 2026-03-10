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
import { isMinor } from "@/lib/utils/minor-detection";
import { formatPrice } from "@/lib/utils/pricing";

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
    totalPrice: number | null;
    variableSymbol: string | null;
    createdAt: Date;
}

interface SubmissionsTableProps {
    submissions: Submission[];
    fields: FormField[];
    yearId: string;
    statusFilter: RegistrationStatus | null;
    eventStartDate?: Date | null;
}

export function SubmissionsTable({ submissions, fields, yearId, statusFilter, eventStartDate }: SubmissionsTableProps) {
    const router = useRouter();

    // Get first 4 input fields for column display
    const displayFields = fields
        .filter((f): f is InputField => isInputField(f))
        .slice(0, 4);

    // Find birth_date fields for minor detection
    const allInputFields = fields.filter((f): f is InputField => isInputField(f));
    const birthDateFields = allInputFields.filter((f) => f.type === "birth_date");
    const apBirthDateFields = birthDateFields.filter((f) => f.includeForAdditionalPeople);
    const refDate = eventStartDate ? new Date(eventStartDate) : undefined;

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
                        <TableCell>Osoby</TableCell>
                        <TableCell>Stav</TableCell>
                        <TableCell>Zaplaceno</TableCell>
                        <TableCell>Cena</TableCell>
                        <TableCell>VS</TableCell>
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
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 200, display: "inline" }}>
                                            {String(data[field.name] ?? "")}
                                        </Typography>
                                        {field.type === "birth_date" && !!data[field.name] && isMinor(String(data[field.name]), refDate) && (
                                            <Chip
                                                label="Nezletilý"
                                                color="warning"
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <Typography variant="body2">
                                        {(() => {
                                            const ap = data.additionalPeople;
                                            const apCount = Array.isArray(ap) ? ap.length : 0;

                                            // Count minors among main person and additional people
                                            let minorCount = 0;
                                            if (birthDateFields.length > 0) {
                                                for (const bf of birthDateFields) {
                                                    const val = data[bf.name];
                                                    if (val && isMinor(String(val), refDate)) {
                                                        minorCount++;
                                                    }
                                                }
                                            }
                                            if (apBirthDateFields.length > 0 && Array.isArray(ap)) {
                                                for (const person of ap) {
                                                    if (!person || typeof person !== "object") continue;
                                                    const personData = person as Record<string, unknown>;
                                                    for (const bf of apBirthDateFields) {
                                                        const val = personData[bf.name];
                                                        if (val && isMinor(String(val), refDate)) {
                                                            minorCount++;
                                                        }
                                                    }
                                                }
                                            }

                                            const base = apCount > 0 ? `1 + ${apCount}` : "1";
                                            return minorCount > 0 ? `${base} (${minorCount} nezl.)` : base;
                                        })()}
                                    </Typography>
                                </TableCell>
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
                                        {submission.totalPrice != null ? formatPrice(submission.totalPrice) : "—"}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2" noWrap sx={{ fontFamily: "monospace" }}>
                                        {submission.variableSymbol ?? "—"}
                                    </Typography>
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
