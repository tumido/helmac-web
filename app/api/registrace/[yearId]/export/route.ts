import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAllInputFields, getAPInputFields } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import { resolveSubmissionDataForDisplay } from "@/lib/utils/pricing-display";
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

    // Optional filters from query params
    const statusParam = request.nextUrl.searchParams.get("status");
    const paidParam = request.nextUrl.searchParams.get("paid");
    const fieldParam = request.nextUrl.searchParams.get("field");
    const valueParam = request.nextUrl.searchParams.get("value");
    const testParam = request.nextUrl.searchParams.get("test");

    const validStatuses = ["PENDING", "CONFIRMED", "WAITLIST", "CANCELLED", "REJECTED"];
    const statusFilter = statusParam && validStatuses.includes(statusParam) ? statusParam : null;
    const paidFilter = paidParam === "true" ? true : paidParam === "false" ? false : null;
    const testFilter: "real" | "test" | "all" =
        testParam === "test" || testParam === "all" ? testParam : "real";

    const submissionWhere: Record<string, unknown> = { yearId };
    if (statusFilter) {
        submissionWhere.status = statusFilter;
    }
    if (paidFilter !== null) {
        submissionWhere.isPaid = paidFilter;
    }
    if (testFilter === "real") {
        submissionWhere.isTest = false;
    } else if (testFilter === "test") {
        submissionWhere.isTest = true;
    }

    const year = await db.year.findUnique({
        where: { id: yearId },
        select: {
            year: true,
            startDate: true,
            registrationForm: {
                select: { fields: true },
            },
            registrationSubmissions: {
                where: submissionWhere,
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

    // Apply field-value filter (JSON field, must filter in JS)
    let submissions = year.registrationSubmissions;
    if (fieldParam && valueParam) {
        submissions = submissions.filter((sub) => {
            const data = sub.data as Record<string, unknown>;
            const rawVal = data[fieldParam];
            if (rawVal === true || rawVal === false) {
                return (rawVal ? "Ano" : "Ne") === valueParam;
            }
            if (typeof rawVal === "string" && rawVal.startsWith("[")) {
                try {
                    const arr = JSON.parse(rawVal);
                    if (Array.isArray(arr)) {
                        return arr.includes(valueParam);
                    }
                } catch { /* not JSON */ }
            }
            return String(rawVal ?? "") === valueParam;
        });
    }

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
    for (const sub of submissions) {
        // Resolve pricing option ids (GUIDs) to human-readable names, matching
        // the admin UI and confirmation emails. Leaves non-pricing fields and
        // additionalPeople untouched (shallow copy of top-level keys only).
        const data = resolveSubmissionDataForDisplay(
            sub.data as Record<string, unknown>,
            inputFields,
            formData.pricingDefinitions,
        );

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
                const personData = resolveSubmissionDataForDisplay(
                    person as Record<string, unknown>,
                    inputFields,
                    formData.pricingDefinitions,
                );
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
