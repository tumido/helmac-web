"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubmissionsCount } from "@/components/admin/submissions-count-context";
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
    Checkbox,
} from "@mui/material";
import {
    toggleSubmissionPayment,
    togglePersonIsAttending,
} from "@/lib/actions/registration-submissions";
import {
    CheckCircle,
    Cancel,
    Email,
    Search,
} from "@mui/icons-material";
import { AdminNoteButton } from "@/components/admin/admin-note-button";
import { isMinor } from "@/lib/utils/minor-detection";
import { formatPrice } from "@/lib/utils/pricing";
import { formatDate } from "@/lib/utils/date";
import type { OrderRow } from "@/lib/services/v2";

interface FieldInfo {
    name: string;
    label: string;
    type: string;
    includeForAdditionalPeople: boolean;
}

interface SubmissionsTableProps {
    orders: OrderRow[];
    displayFields: FieldInfo[];
    allFields: FieldInfo[];
    yearId: string;
    statusFilter: string | null;
    paidFilter: boolean | null;
    fieldFilter: string | null;
    valueFilter: string | null;
    eventStartDate?: Date | null;
    readOnly?: boolean;
}

function renderValue(
    field: FieldInfo,
    values: Record<string, string>,
): string {
    const raw = values[field.name];
    if (!raw) return "";
    return raw;
}

type SortKey = string;
type SortDirection = "asc" | "desc";

export function SubmissionsTable({
    orders,
    displayFields,
    allFields,
    yearId,
    statusFilter,
    paidFilter,
    fieldFilter,
    valueFilter,
    eventStartDate,
    readOnly = false,
}: SubmissionsTableProps) {
    const router = useRouter();
    const { setDisplayedCount } = useSubmissionsCount();
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] =
        useState<SortKey>("createdAt");
    const [sortDir, setSortDir] =
        useState<SortDirection>("desc");

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((prev) =>
                prev === "asc" ? "desc" : "asc",
            );
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const birthDateFields = allFields.filter(
        (f) => f.type === "birth_date",
    );
    const apBirthDateFields = birthDateFields.filter(
        (f) => f.includeForAdditionalPeople,
    );
    const refDate = eventStartDate
        ? new Date(eventStartDate)
        : undefined;

    const mainValues = (o: OrderRow) =>
        o.people[0]?.values ?? {};
    const apPeople = (o: OrderRow) =>
        o.people.filter((p) => p.personIndex > 0);

    // Filtering
    const statusFiltered = statusFilter
        ? orders.filter((o) => o.status === statusFilter)
        : orders;

    const paidFiltered =
        paidFilter !== null
            ? statusFiltered.filter(
                  (o) => o.isPaid === paidFilter,
              )
            : statusFiltered;

    // Match primary + additional people so the filtered count agrees with v2 option counts
    const fieldFiltered =
        fieldFilter && valueFilter
            ? paidFiltered.filter((o) =>
                  o.people.some((p) => {
                      const val = p.values[fieldFilter];
                      if (
                          val === "true" ||
                          val === "false"
                      ) {
                          return (
                              (val === "true"
                                  ? "Ano"
                                  : "Ne") === valueFilter
                          );
                      }
                      if (
                          typeof val === "string" &&
                          val.includes(", ")
                      ) {
                          return val
                              .split(", ")
                              .includes(valueFilter);
                      }
                      return (val ?? "") === valueFilter;
                  }),
              )
            : paidFiltered;

    const filtered = search.trim()
        ? fieldFiltered.filter((o) => {
              const term = search.trim().toLowerCase();
              for (const val of Object.values(
                  mainValues(o),
              )) {
                  if (
                      val
                          ?.toLowerCase()
                          .includes(term)
                  )
                      return true;
              }
              for (const p of apPeople(o)) {
                  for (const val of Object.values(
                      p.values,
                  )) {
                      if (
                          val
                              ?.toLowerCase()
                              .includes(term)
                      )
                          return true;
                  }
              }
              if (
                  o.variableSymbol
                      ?.toLowerCase()
                      .includes(term)
              )
                  return true;
              return false;
          })
        : fieldFiltered;

    // Report the displayed count up to the badge (see SubmissionsCountChip).
    useEffect(() => {
        setDisplayedCount(filtered.length);
    }, [filtered.length, setDisplayedCount]);

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey.startsWith("field:")) {
            const name = sortKey.slice(6);
            const aVal = mainValues(a)[name] ?? "";
            const bVal = mainValues(b)[name] ?? "";
            return dir * aVal.localeCompare(bVal, "cs");
        }
        switch (sortKey) {
            case "peopleCount":
                return (
                    dir *
                    (a.people.length - b.people.length)
                );
            case "isPaid":
                return (
                    dir *
                    (Number(a.isPaid) - Number(b.isPaid))
                );
            case "totalPrice":
                return (
                    dir *
                    ((a.totalPrice ?? -Infinity) -
                        (b.totalPrice ?? -Infinity))
                );
            case "variableSymbol":
                return (
                    dir *
                    (a.variableSymbol ?? "").localeCompare(
                        b.variableSymbol ?? "",
                        "cs",
                    )
                );
            case "emailSent":
                return (
                    dir *
                    (Number(a.emailSent) -
                        Number(b.emailSent))
                );
            case "adminNote":
                return (
                    dir *
                    (Number(!!a.adminNote) -
                        Number(!!b.adminNote))
                );
            case "isAttending":
                return (
                    dir *
                    (Number(
                        a.people[0]?.isAttending,
                    ) -
                        Number(
                            b.people[0]?.isAttending,
                        ))
                );
            case "createdAt":
                return (
                    dir *
                    (new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime())
                );
            default:
                return 0;
        }
    });

    if (filtered.length === 0 && !search.trim()) {
        return (
            <Typography
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
            >
                {statusFilter
                    ? "Žádné registrace s tímto stavem"
                    : "Zatím žádné registrace"}
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
                <Typography
                    color="text.secondary"
                    sx={{ textAlign: "center", py: 4 }}
                >
                    Žádné výsledky
                </Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                {displayFields.map(
                                    (field) => {
                                        const key = `field:${field.name}`;
                                        return (
                                            <TableCell
                                                key={
                                                    field.name
                                                }
                                                sortDirection={
                                                    sortKey ===
                                                    key
                                                        ? sortDir
                                                        : false
                                                }
                                            >
                                                <TableSortLabel
                                                    active={
                                                        sortKey ===
                                                        key
                                                    }
                                                    direction={
                                                        sortKey ===
                                                        key
                                                            ? sortDir
                                                            : "asc"
                                                    }
                                                    onClick={() =>
                                                        handleSort(
                                                            key,
                                                        )
                                                    }
                                                >
                                                    {
                                                        field.label
                                                    }
                                                </TableSortLabel>
                                            </TableCell>
                                        );
                                    },
                                )}
                                {(
                                    [
                                        [
                                            "peopleCount",
                                            "Osoby",
                                        ],
                                        [
                                            "isPaid",
                                            "Zaplaceno",
                                        ],
                                        [
                                            "totalPrice",
                                            "Cena",
                                        ],
                                        [
                                            "variableSymbol",
                                            "VS",
                                        ],
                                        [
                                            "emailSent",
                                            "Email",
                                        ],
                                        [
                                            "adminNote",
                                            "Poznámka",
                                        ],
                                        [
                                            "createdAt",
                                            "Datum",
                                        ],
                                        [
                                            "isAttending",
                                            "Je přítomen",
                                        ],
                                    ] as const
                                ).map(([key, label]) => (
                                    <TableCell
                                        key={key}
                                        sortDirection={
                                            sortKey === key
                                                ? sortDir
                                                : false
                                        }
                                    >
                                        <TableSortLabel
                                            active={
                                                sortKey ===
                                                key
                                            }
                                            direction={
                                                sortKey ===
                                                key
                                                    ? sortDir
                                                    : "asc"
                                            }
                                            onClick={() =>
                                                handleSort(
                                                    key,
                                                )
                                            }
                                        >
                                            {label}
                                        </TableSortLabel>
                                    </TableCell>
                                ))}
                                <TableCell></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sorted.map((order) => {
                                const values =
                                    mainValues(order);
                                const ap = apPeople(order);
                                const hasAP =
                                    ap.length > 0;
                                const detailUrl = `/admin/rocniky/${yearId}/registrace/${order.legacySubmissionId ?? order.id}`;
                                const isMainMinor =
                                    birthDateFields.some(
                                        (bf) => {
                                            const val =
                                                values[
                                                    bf.name
                                                ];
                                            return (
                                                val &&
                                                isMinor(
                                                    val,
                                                    refDate,
                                                )
                                            );
                                        },
                                    );

                                return (
                                    <Fragment
                                        key={order.id}
                                    >
                                        <TableRow
                                            hover
                                            sx={{
                                                cursor: "pointer",
                                                ...(hasAP && {
                                                    "& td":
                                                        {
                                                            borderBottom: 0,
                                                        },
                                                }),
                                                ...(isMainMinor && {
                                                    "& td:first-of-type":
                                                        {
                                                            borderLeft: 3,
                                                            borderLeftColor:
                                                                "warning.main",
                                                        },
                                                }),
                                            }}
                                            onClick={() =>
                                                router.push(
                                                    detailUrl,
                                                )
                                            }
                                        >
                                            {displayFields.map(
                                                (
                                                    field,
                                                    idx,
                                                ) => (
                                                    <TableCell
                                                        key={
                                                            field.name
                                                        }
                                                    >
                                                        {idx ===
                                                            0 &&
                                                            order.isTest && (
                                                                <Chip
                                                                    label="TEST"
                                                                    color="warning"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        mr: 1,
                                                                        fontWeight: 700,
                                                                    }}
                                                                />
                                                            )}
                                                        {field.type ===
                                                            "birth_date" &&
                                                        values[
                                                            field
                                                                .name
                                                        ] &&
                                                        isMinor(
                                                            values[
                                                                field
                                                                    .name
                                                            ],
                                                            refDate,
                                                        ) ? (
                                                            <Tooltip title="Nezletilý">
                                                                <Chip
                                                                    label={
                                                                        values[
                                                                            field
                                                                                .name
                                                                        ]
                                                                    }
                                                                    color="warning"
                                                                    size="small"
                                                                />
                                                            </Tooltip>
                                                        ) : (
                                                            <Typography
                                                                variant="body2"
                                                                noWrap
                                                                sx={{
                                                                    maxWidth: 200,
                                                                    display:
                                                                        "inline",
                                                                }}
                                                            >
                                                                {renderValue(
                                                                    field,
                                                                    values,
                                                                )}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                ),
                                            )}
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {(() => {
                                                        let minorCount = 0;
                                                        for (const bf of birthDateFields) {
                                                            if (
                                                                values[
                                                                    bf
                                                                        .name
                                                                ] &&
                                                                isMinor(
                                                                    values[
                                                                        bf
                                                                            .name
                                                                    ],
                                                                    refDate,
                                                                )
                                                            )
                                                                minorCount++;
                                                        }
                                                        for (const p of ap) {
                                                            for (const bf of apBirthDateFields) {
                                                                if (
                                                                    p
                                                                        .values[
                                                                        bf
                                                                            .name
                                                                    ] &&
                                                                    isMinor(
                                                                        p
                                                                            .values[
                                                                            bf
                                                                                .name
                                                                        ],
                                                                        refDate,
                                                                    )
                                                                )
                                                                    minorCount++;
                                                            }
                                                        }
                                                        const base =
                                                            ap.length >
                                                            0
                                                                ? `1 + ${ap.length}`
                                                                : "1";
                                                        return minorCount >
                                                            0
                                                            ? `${base} (${minorCount} nezl.)`
                                                            : base;
                                                    })()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                {order.isPaid ? (
                                                    <CheckCircle
                                                        fontSize="small"
                                                        color="success"
                                                    />
                                                ) : (
                                                    <Cancel
                                                        fontSize="small"
                                                        color="disabled"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                >
                                                    {order.totalPrice !=
                                                    null
                                                        ? formatPrice(
                                                              order.totalPrice,
                                                          )
                                                        : "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                    sx={{
                                                        fontFamily:
                                                            "monospace",
                                                    }}
                                                >
                                                    {order.variableSymbol ??
                                                        "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip
                                                    title={
                                                        order.emailSent
                                                            ? "Email odeslán"
                                                            : "Email neodeslán"
                                                    }
                                                >
                                                    <Email
                                                        fontSize="small"
                                                        color={
                                                            order.emailSent
                                                                ? "success"
                                                                : "disabled"
                                                        }
                                                    />
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell
                                                onClick={(
                                                    e,
                                                ) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {!readOnly &&
                                                    order.legacySubmissionId && (
                                                        <AdminNoteButton
                                                            submissionId={
                                                                order.legacySubmissionId
                                                            }
                                                            adminNote={
                                                                order.adminNote
                                                            }
                                                        />
                                                    )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    noWrap
                                                >
                                                    {formatDate(
                                                        order.createdAt,
                                                    )}
                                                </Typography>
                                            </TableCell>
                                            <TableCell
                                                onClick={(
                                                    e,
                                                ) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                <Checkbox
                                                    size="small"
                                                    checked={
                                                        order
                                                            .people[0]
                                                            ?.isAttending ??
                                                        false
                                                    }
                                                    disabled={
                                                        readOnly
                                                    }
                                                    onChange={async () => {
                                                        const p =
                                                            order
                                                                .people[0];
                                                        if (
                                                            p
                                                        )
                                                            await togglePersonIsAttending(
                                                                p.id,
                                                                !p.isAttending,
                                                            );
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell
                                                onClick={(
                                                    e,
                                                ) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {!readOnly &&
                                                    !order.isPaid &&
                                                    order.legacySubmissionId && (
                                                        <Button
                                                            variant="outlined"
                                                            size="small"
                                                            onClick={async () => {
                                                                await toggleSubmissionPayment(
                                                                    order.legacySubmissionId!,
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            Zaplatit
                                                        </Button>
                                                    )}
                                            </TableCell>
                                        </TableRow>
                                        {ap.map(
                                            (
                                                person,
                                                apIdx,
                                            ) => {
                                                const isLast =
                                                    apIdx ===
                                                    ap.length -
                                                        1;
                                                const isAPMinor =
                                                    apBirthDateFields.some(
                                                        (
                                                            bf,
                                                        ) =>
                                                            person
                                                                .values[
                                                                bf
                                                                    .name
                                                            ] &&
                                                            isMinor(
                                                                person
                                                                    .values[
                                                                    bf
                                                                        .name
                                                                ],
                                                                refDate,
                                                            ),
                                                    );
                                                return (
                                                    <TableRow
                                                        key={`${order.id}-ap-${apIdx}`}
                                                        sx={{
                                                            cursor: "pointer",
                                                            backgroundColor:
                                                                "action.hover",
                                                            ...(!isLast && {
                                                                "& td":
                                                                    {
                                                                        borderBottom: 0,
                                                                    },
                                                            }),
                                                        }}
                                                        onClick={() =>
                                                            router.push(
                                                                detailUrl,
                                                            )
                                                        }
                                                    >
                                                        {displayFields.map(
                                                            (
                                                                field,
                                                                fIdx,
                                                            ) => (
                                                                <TableCell
                                                                    key={
                                                                        field.name
                                                                    }
                                                                    sx={{
                                                                        ...(fIdx ===
                                                                            0 && {
                                                                            borderLeft: 3,
                                                                            borderLeftColor:
                                                                                isAPMinor
                                                                                    ? "warning.main"
                                                                                    : "grey.400",
                                                                            pl: 3,
                                                                        }),
                                                                    }}
                                                                >
                                                                    {field.includeForAdditionalPeople ? (
                                                                        field.type ===
                                                                            "birth_date" &&
                                                                        person
                                                                            .values[
                                                                            field
                                                                                .name
                                                                        ] &&
                                                                        isMinor(
                                                                            person
                                                                                .values[
                                                                                field
                                                                                    .name
                                                                            ],
                                                                            refDate,
                                                                        ) ? (
                                                                            <Tooltip title="Nezletilý">
                                                                                <Chip
                                                                                    label={
                                                                                        person
                                                                                            .values[
                                                                                            field
                                                                                                .name
                                                                                        ]
                                                                                    }
                                                                                    color="warning"
                                                                                    size="small"
                                                                                />
                                                                            </Tooltip>
                                                                        ) : (
                                                                            <Typography
                                                                                variant="body2"
                                                                                noWrap
                                                                                sx={{
                                                                                    maxWidth: 200,
                                                                                    display:
                                                                                        "inline",
                                                                                }}
                                                                            >
                                                                                {renderValue(
                                                                                    field,
                                                                                    person.values,
                                                                                )}
                                                                            </Typography>
                                                                        )
                                                                    ) : null}
                                                                </TableCell>
                                                            ),
                                                        )}
                                                        <TableCell />
                                                        <TableCell />
                                                        <TableCell />
                                                        <TableCell />
                                                        <TableCell />
                                                        <TableCell />
                                                        <TableCell />
                                                        <TableCell
                                                            onClick={(
                                                                e,
                                                            ) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <Checkbox
                                                                size="small"
                                                                checked={
                                                                    person.isAttending
                                                                }
                                                                disabled={
                                                                    readOnly
                                                                }
                                                                onChange={async () => {
                                                                    await togglePersonIsAttending(
                                                                        person.id,
                                                                        !person.isAttending,
                                                                    );
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell />
                                                    </TableRow>
                                                );
                                            },
                                        )}
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
