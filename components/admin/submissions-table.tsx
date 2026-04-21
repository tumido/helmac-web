"use client";

import { Fragment, useState } from "react";
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
    TextField,
    InputAdornment,
    TableSortLabel,
} from "@mui/material";
import { toggleSubmissionPayment } from "@/lib/actions/registration-submissions";
import { CheckCircle, Cancel, Email, Search } from "@mui/icons-material";
import { AdminNoteButton } from "@/components/admin/admin-note-button";
import type { FormField, InputField } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";
import type { RegistrationStatus } from "@prisma/client";
import { isMinor } from "@/lib/utils/minor-detection";
import { formatPrice } from "@/lib/utils/pricing";
import { getAdditionalPeople } from "@/lib/utils/additional-people";
import { formatDate } from "@/lib/utils/date";


interface Submission {
    id: string;
    data: unknown;
    status: RegistrationStatus;
    isPaid: boolean;
    paidAt: Date | null;
    totalPrice: number | null;
    variableSymbol: string | null;
    emailSent: boolean;
    adminNote: string | null;
    createdAt: Date;
}

interface SubmissionsTableProps {
    submissions: Submission[];
    fields: FormField[];
    yearId: string;
    statusFilter: RegistrationStatus | null;
    paidFilter: boolean | null;
    fieldFilter: string | null;
    valueFilter: string | null;
    eventStartDate?: Date | null;
}

type SortKey = string;
type SortDirection = "asc" | "desc";

export function SubmissionsTable({ submissions, fields, yearId, statusFilter, paidFilter, fieldFilter, valueFilter, eventStartDate }: SubmissionsTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortDir, setSortDir] = useState<SortDirection>("desc");

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    // Get first 4 input fields for column display
    const displayFields = fields
        .filter((f): f is InputField => isInputField(f))
        .slice(0, 4);

    // Find birth_date fields for minor detection
    const allInputFields = fields.filter((f): f is InputField => isInputField(f));
    const birthDateFields = allInputFields.filter((f) => f.type === "birth_date");
    const apBirthDateFields = birthDateFields.filter((f) => f.includeForAdditionalPeople);
    const refDate = eventStartDate ? new Date(eventStartDate) : undefined;

    const statusFiltered = statusFilter
        ? submissions.filter((s) => s.status === statusFilter)
        : submissions;

    const paidFiltered = paidFilter !== null
        ? statusFiltered.filter((s) => s.isPaid === paidFilter)
        : statusFiltered;

    const fieldFiltered = fieldFilter && valueFilter
        ? paidFiltered.filter((s) => {
            const data = s.data as Record<string, unknown>;
            const rawVal = data[fieldFilter];
            // Checkbox fields store boolean, but filter uses "Ano"/"Ne"
            if (rawVal === true || rawVal === false) {
                return (rawVal ? "Ano" : "Ne") === valueFilter;
            }
            // pricing_multi_select stores JSON array string
            if (typeof rawVal === "string" && rawVal.startsWith("[")) {
                try {
                    const arr = JSON.parse(rawVal);
                    if (Array.isArray(arr)) {
                        return arr.includes(valueFilter);
                    }
                } catch { /* not JSON */ }
            }
            return String(rawVal ?? "") === valueFilter;
        })
        : paidFiltered;

    const filtered = search.trim()
        ? fieldFiltered.filter((s) => {
            const term = search.trim().toLowerCase();
            const data = s.data as Record<string, unknown>;

            // Search main form data values
            for (const val of Object.values(data)) {
                if (val != null && String(val).toLowerCase().includes(term)) {
                    return true;
                }
            }

            // Search additional people data
            const ap = getAdditionalPeople(data);
            for (const person of ap) {
                const personData = person as Record<string, unknown>;
                for (const val of Object.values(personData)) {
                    if (val != null && String(val).toLowerCase().includes(term)) {
                        return true;
                    }
                }
            }

            // Search variable symbol
            if (s.variableSymbol && s.variableSymbol.toLowerCase().includes(term)) {
                return true;
            }

            return false;
        })
        : fieldFiltered;

    const sorted = [...filtered].sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        if (sortKey.startsWith("field:")) {
            const fieldName = sortKey.slice(6);
            const aVal = String((a.data as Record<string, unknown>)[fieldName] ?? "");
            const bVal = String((b.data as Record<string, unknown>)[fieldName] ?? "");
            return dir * aVal.localeCompare(bVal, "cs");
        }

        switch (sortKey) {
            case "peopleCount": {
                const aCount = 1 + getAdditionalPeople(a.data as Record<string, unknown>).length;
                const bCount = 1 + getAdditionalPeople(b.data as Record<string, unknown>).length;
                return dir * (aCount - bCount);
            }
            case "isPaid":
                return dir * (Number(a.isPaid) - Number(b.isPaid));
            case "totalPrice":
                return dir * ((a.totalPrice ?? -Infinity) - (b.totalPrice ?? -Infinity));
            case "variableSymbol":
                return dir * (a.variableSymbol ?? "").localeCompare(b.variableSymbol ?? "", "cs");
            case "emailSent":
                return dir * (Number(a.emailSent) - Number(b.emailSent));
            case "adminNote":
                return dir * (Number(!!a.adminNote) - Number(!!b.adminNote));
            case "createdAt":
                return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            default:
                return 0;
        }
    });

    if (filtered.length === 0 && !search.trim()) {
        return (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                {statusFilter ? "Žádné registrace s tímto stavem" : "Zatím žádné registrace"}
            </Typography>
        );
    }

    return (
        <>
        <TextField
            size="small"
            placeholder="Hledat..."
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search />
                    </InputAdornment>
                ),
            }}
        />
        {filtered.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                Žádné výsledky
            </Typography>
        ) : (
        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow>
                        {displayFields.map((field) => {
                            const key = `field:${field.name}`;
                            return (
                                <TableCell key={field.id} sortDirection={sortKey === key ? sortDir : false}>
                                    <TableSortLabel
                                        active={sortKey === key}
                                        direction={sortKey === key ? sortDir : "asc"}
                                        onClick={() => handleSort(key)}
                                    >
                                        {field.label}
                                    </TableSortLabel>
                                </TableCell>
                            );
                        })}
                        {([
                            ["peopleCount", "Osoby"],
                            ["isPaid", "Zaplaceno"],
                            ["totalPrice", "Cena"],
                            ["variableSymbol", "VS"],
                            ["emailSent", "Email"],
                            ["adminNote", "Poznámka"],
                            ["createdAt", "Datum"],
                        ] as const).map(([key, label]) => (
                            <TableCell key={key} sortDirection={sortKey === key ? sortDir : false}>
                                <TableSortLabel
                                    active={sortKey === key}
                                    direction={sortKey === key ? sortDir : "asc"}
                                    onClick={() => handleSort(key)}
                                >
                                    {label}
                                </TableSortLabel>
                            </TableCell>
                        ))}
                        <TableCell></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sorted.map((submission) => {
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
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <AdminNoteButton
                                            submissionId={submission.id}
                                            adminNote={submission.adminNote}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap>
                                            {formatDate(submission.createdAt)}
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
                                            {/* Empty cells for Osoby, Zaplaceno, Cena, VS, Email, Poznámka, Datum, Akce */}
                                            <TableCell />
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
        )}
        </>
    );
}
