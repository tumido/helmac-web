import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAllInputFields, getAPInputFields } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { formatDateTime } from "@/lib/utils/date";
import { isMinor } from "@/lib/utils/minor-detection";

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
            startDate: true,
            registrationForm: {
                select: { fields: true },
            },
            registrationSubmissions: {
                orderBy: { createdAt: "asc" },
                select: {
                    data: true,
                    status: true,
                    isPaid: true,
                    totalPrice: true,
                    variableSymbol: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!year || !year.registrationForm) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const formData = migrateFormData(year.registrationForm.fields);
    const inputFields = getAllInputFields(formData.fields);
    const apFieldNames = new Set(getAPInputFields(formData.fields).map((f) => f.name));
    const refDate = year.startDate ? new Date(year.startDate) : undefined;

    // Build CSV header (add "Nezletilý" column after each birth_date field)
    const headers = [
        "Typ",
        ...inputFields.flatMap((f) =>
            f.type === "birth_date" ? [f.label, "Nezletilý"] : [f.label]
        ),
        "Stav",
        "Zaplaceno",
        "Cena",
        "VS",
        "Datum registrace",
    ];

    // Build CSV rows (main person + AP rows)
    const rows: string[][] = [];
    for (const sub of year.registrationSubmissions) {
        const data = sub.data as Record<string, unknown>;

        // Main person row
        rows.push([
            "Hlavní",
            ...inputFields.flatMap((f) => {
                const val = data[f.name];
                const formatted = val === true ? "Ano" : val === false ? "Ne" : String(val ?? "");
                if (f.type === "birth_date") {
                    const minor = val ? isMinor(String(val), refDate) : false;
                    return [formatted, minor ? "Ano" : "Ne"];
                }
                return [formatted];
            }),
            STATUS_LABELS[sub.status] || sub.status,
            sub.isPaid ? "Ano" : "Ne",
            sub.totalPrice != null ? String(sub.totalPrice) : "",
            sub.variableSymbol ?? "",
            formatDateTime(sub.createdAt),
        ]);

        // Additional people rows
        const ap = data.additionalPeople;
        if (Array.isArray(ap)) {
            ap.forEach((person, idx) => {
                if (!person || typeof person !== "object") return;
                const personData = person as Record<string, unknown>;
                rows.push([
                    `Další osoba ${idx + 1}`,
                    ...inputFields.flatMap((f) => {
                        if (!apFieldNames.has(f.name)) {
                            return f.type === "birth_date" ? ["", ""] : [""];
                        }
                        const val = personData[f.name];
                        const formatted = val === true ? "Ano" : val === false ? "Ne" : String(val ?? "");
                        if (f.type === "birth_date") {
                            const minor = val ? isMinor(String(val), refDate) : false;
                            return [formatted, minor ? "Ano" : "Ne"];
                        }
                        return [formatted];
                    }),
                    "", // Status empty for AP rows
                    "", // Paid empty for AP rows
                    "", // Price empty for AP rows
                    sub.variableSymbol ?? "", // Same VS as main person
                    "", // Date empty for AP rows
                ]);
            });
        }
    }

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
