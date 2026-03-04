import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FormField, InputField } from "@/lib/types/registration-form";
import { isInputField } from "@/lib/types/registration-form";

const STATUS_LABELS: Record<string, string> = {
    PENDING: "Čeká",
    CONFIRMED: "Potvrzeno",
    WAITLIST: "Čekací listina",
    CANCELLED: "Zrušeno",
    REJECTED: "Zamítnuto",
};

function escapeCsvValue(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ yearId: string }> }
) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { yearId } = await params;

    const year = await db.year.findUnique({
        where: { id: yearId },
        select: {
            year: true,
            registrationForm: {
                select: { fields: true },
            },
            registrationSubmissions: {
                orderBy: { createdAt: "asc" },
                select: {
                    data: true,
                    status: true,
                    isPaid: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!year || !year.registrationForm) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const fields = year.registrationForm.fields as unknown as FormField[];
    const inputFields = fields.filter((f): f is InputField => isInputField(f));

    // Build CSV header
    const headers = [
        ...inputFields.map((f) => f.label),
        "Stav",
        "Zaplaceno",
        "Datum registrace",
    ];

    // Build CSV rows
    const rows = year.registrationSubmissions.map((sub) => {
        const data = sub.data as Record<string, unknown>;
        return [
            ...inputFields.map((f) => {
                const val = data[f.name];
                if (val === true) return "Ano";
                if (val === false) return "Ne";
                return String(val ?? "");
            }),
            STATUS_LABELS[sub.status] || sub.status,
            sub.isPaid ? "Ano" : "Ne",
            new Date(sub.createdAt).toLocaleString("cs-CZ"),
        ];
    });

    // Generate CSV with UTF-8 BOM for Excel
    const BOM = "\uFEFF";
    const csvContent =
        BOM +
        headers.map(escapeCsvValue).join(",") +
        "\n" +
        rows.map((row) => row.map(escapeCsvValue).join(",")).join("\n");

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="registrace-${year.year}.csv"`,
        },
    });
}
