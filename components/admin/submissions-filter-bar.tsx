"use client";

import { useRouter } from "next/navigation";
import {
    Box,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";

interface SubmissionsFilterBarProps {
    basePath: string;
    statusFilter: string | null;
    paidFilter: boolean | null;
    testFilter: "real" | "test" | "all";
    isEditor: boolean;
    statusParam: string;
    paidParam: string;
    testParam: string;
}

const STATUS_OPTIONS = [
    { value: "", label: "Vše" },
    { value: "PENDING", label: "Čeká" },
    { value: "CONFIRMED", label: "Potvrzeno" },
    { value: "WAITLIST", label: "Čekací listina" },
    { value: "CANCELLED", label: "Zrušeno" },
    { value: "REJECTED", label: "Zamítnuto" },
];

const PAID_OPTIONS = [
    { value: "", label: "Vše" },
    { value: "true", label: "Zaplaceno" },
    { value: "false", label: "Nezaplaceno" },
];

const TEST_OPTIONS = [
    { value: "real", label: "Reálné" },
    { value: "test", label: "Testovací" },
    { value: "all", label: "Vše (vč. test)" },
];

export function SubmissionsFilterBar({
    basePath,
    statusFilter,
    paidFilter,
    testFilter,
    isEditor,
    statusParam,
    paidParam,
    testParam,
}: SubmissionsFilterBarProps) {
    const router = useRouter();

    const navigate = (params: string[]) => {
        const query = params.filter(Boolean).join("&");
        router.push(
            query
                ? `${basePath}?${query}`
                : basePath,
        );
    };

    return (
        <Box
            sx={{
                display: "flex",
                gap: 1.5,
                mb: 2,
                alignItems: "center",
                flexWrap: "wrap",
            }}
        >
            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Stav</InputLabel>
                <Select
                    value={statusFilter ?? ""}
                    label="Stav"
                    onChange={(e) => {
                        const v = e.target.value;
                        navigate([
                            v ? `status=${v}` : "",
                            paidParam,
                            testParam,
                        ]);
                    }}
                >
                    {STATUS_OPTIONS.map((o) => (
                        <MenuItem
                            key={o.value}
                            value={o.value}
                        >
                            {o.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Platba</InputLabel>
                <Select
                    value={
                        paidFilter === null
                            ? ""
                            : String(paidFilter)
                    }
                    label="Platba"
                    onChange={(e) => {
                        const v = e.target.value;
                        navigate([
                            statusParam,
                            v ? `paid=${v}` : "",
                            testParam,
                        ]);
                    }}
                >
                    {PAID_OPTIONS.map((o) => (
                        <MenuItem
                            key={o.value}
                            value={o.value}
                        >
                            {o.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {!isEditor && (
                <FormControl
                    size="small"
                    sx={{ minWidth: 150 }}
                >
                    <InputLabel>Registrace</InputLabel>
                    <Select
                        value={testFilter}
                        label="Registrace"
                        onChange={(e) => {
                            const v = e.target.value;
                            navigate([
                                statusParam,
                                paidParam,
                                v === "real"
                                    ? ""
                                    : `test=${v}`,
                            ]);
                        }}
                    >
                        {TEST_OPTIONS.map((o) => (
                            <MenuItem
                                key={o.value}
                                value={o.value}
                            >
                                {o.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );
}
