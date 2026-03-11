"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Chip,
    Tooltip,
    Typography,
} from "@mui/material";
import { toggleSubmissionPayment } from "@/lib/actions/registration-submissions";
import { CheckCircle, Cancel, Email } from "@mui/icons-material";
import type { FormField, InputField } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import type { RegistrationStatus } from "@prisma/client";
import { isMinor } from "@/lib/utils/minor-detection";
import { formatPrice } from "@/lib/utils/pricing";
import { getAdditionalPeople } from "@/lib/utils/additional-people";


interface Submission {
    id: string;
    data: unknown;
    status: RegistrationStatus;
    isPaid: boolean;
    paidAt: Date | null;
    totalPrice: number | null;
    variableSymbol: string | null;
    emailSent: boolean;
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
                        <TableCell>Zaplaceno</TableCell>
                        <TableCell>Cena</TableCell>
                        <TableCell>VS</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Datum</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filtered.map((submission) => {
                        const data = submission.data as Record<string, unknown>;
                        const ap = getAdditionalPeople(data);
                        const hasAP = ap.length > 0;
                        const detailUrl = `/admin/rocniky/${yearId}/registrace/${submission.id}`;
                        const isMainPersonMinor = birthDateFields.some((bf) => {
                            const val = data[bf.name];
                            return val && isMinor(String(val), refDate);
                        });

                        return (
                            <Fragment key={submission.id}>
                                <TableRow
                                    hover
                                    sx={{
                                        cursor: "pointer",
                                        ...(hasAP && { "& td": { borderBottom: 0 } }),
                                        ...(isMainPersonMinor && {
                                            "& td:first-of-type": {
                                                borderLeft: 3,
                                                borderLeftColor: "warning.main",
                                            },
                                        }),
                                    }}
                                    onClick={() => router.push(detailUrl)}
                                >
                                    {displayFields.map((field) => (
                                        <TableCell key={field.id}>
                                            {field.type === "birth_date" && !!data[field.name] && isMinor(String(data[field.name]), refDate) ? (
                                                <Tooltip title="Nezletilý">
                                                    <Chip
                                                        label={String(data[field.name])}
                                                        color="warning"
                                                        size="small"
                                                    />
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 200, display: "inline" }}>
                                                    {String(data[field.name] ?? "")}
                                                </Typography>
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <Typography variant="body2">
                                            {(() => {
                                                const apCount = ap.length;

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
                                                if (apBirthDateFields.length > 0) {
                                                    for (const person of ap) {
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
                                        <Tooltip title={submission.emailSent ? "Email odeslán" : "Email neodeslán"}>
                                            <Email fontSize="small" color={submission.emailSent ? "success" : "disabled"} />
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap>
                                            {new Date(submission.createdAt).toLocaleDateString("cs-CZ")}
                                        </Typography>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        {!submission.isPaid && (
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={async () => {
                                                    await toggleSubmissionPayment(submission.id, true);
                                                }}
                                            >
                                                Zaplatit
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                                {ap.map((person, apIndex) => {
                                    const personData = person as Record<string, unknown>;
                                    const isLast = apIndex === ap.length - 1;
                                    const isAPMinor = apBirthDateFields.some((bf) => {
                                        const val = personData[bf.name];
                                        return val && isMinor(String(val), refDate);
                                    });
                                    return (
                                        <TableRow
                                            key={`${submission.id}-ap-${apIndex}`}
                                            sx={{
                                                cursor: "pointer",
                                                backgroundColor: "action.hover",
                                                ...(!isLast && { "& td": { borderBottom: 0 } }),
                                            }}
                                            onClick={() => router.push(detailUrl)}
                                        >
                                            {displayFields.map((field, fieldIndex) => (
                                                <TableCell
                                                    key={field.id}
                                                    sx={{
                                                        ...(fieldIndex === 0 && {
                                                            borderLeft: 3,
                                                            borderLeftColor: isAPMinor ? "warning.main" : "grey.400",
                                                            pl: 3,
                                                        }),
                                                    }}
                                                >
                                                    {field.includeForAdditionalPeople ? (
                                                        field.type === "birth_date" && !!personData[field.name] && isMinor(String(personData[field.name]), refDate) ? (
                                                            <Tooltip title="Nezletilý">
                                                                <Chip
                                                                    label={String(personData[field.name])}
                                                                    color="warning"
                                                                    size="small"
                                                                />
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography variant="body2" noWrap sx={{ maxWidth: 200, display: "inline" }}>
                                                                {String(personData[field.name] ?? "")}
                                                            </Typography>
                                                        )
                                                    ) : null}
                                                </TableCell>
                                            ))}
                                            {/* Empty cells for Osoby, Zaplaceno, Cena, VS, Email, Datum, Akce */}
                                            <TableCell />
                                            <TableCell />
                                            <TableCell />
                                            <TableCell />
                                            <TableCell />
                                            <TableCell />
                                            <TableCell />
                                        </TableRow>
                                    );
                                })}
                            </Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
