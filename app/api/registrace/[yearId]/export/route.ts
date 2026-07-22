import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFormStructure } from "@/lib/services/v2";
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
    if (
        value.includes(",") ||
        value.includes('"') ||
        value.includes("\n")
    ) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

function normalizeCheckboxValue(val: string): string {
    if (val === "true") return "Ano";
    if (val === "false") return "Ne";
    return val;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ yearId: string }> },
) {
    try {
        await requireAdmin();
    } catch {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
        );
    }

    const { yearId } = await params;

    const statusParam =
        request.nextUrl.searchParams.get("status");
    const paidParam =
        request.nextUrl.searchParams.get("paid");
    const fieldParam =
        request.nextUrl.searchParams.get("field");
    const valueParam =
        request.nextUrl.searchParams.get("value");
    const testParam =
        request.nextUrl.searchParams.get("test");

    const validStatuses = [
        "PENDING",
        "CONFIRMED",
        "WAITLIST",
        "CANCELLED",
        "REJECTED",
    ];
    const statusFilter =
        statusParam && validStatuses.includes(statusParam)
            ? statusParam
            : null;
    const paidFilter =
        paidParam === "true"
            ? true
            : paidParam === "false"
              ? false
              : null;
    const testFilter: "real" | "test" | "all" =
        testParam === "test" || testParam === "all"
            ? testParam
            : "real";

    const year = await db.year.findUnique({
        where: { id: yearId },
        select: { year: true, startDate: true },
    });
    if (!year) {
        return NextResponse.json(
            { error: "Not found" },
            { status: 404 },
        );
    }

    const formStructure = await getFormStructure(yearId);
    if (!formStructure) {
        return NextResponse.json(
            { error: "Not found" },
            { status: 404 },
        );
    }

    const apFieldNames = new Set(
        formStructure.fields
            .filter((f) => f.includeForAdditionalPeople)
            .map((f) => f.name),
    );
    const refDate = year.startDate
        ? new Date(year.startDate)
        : undefined;

    // Build order filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderWhere: Record<string, any> = {
        yearId,
        parentOrderId: null,
        orderType: "registration",
    };
    if (statusFilter) orderWhere.status = statusFilter;
    if (paidFilter !== null) orderWhere.isPaid = paidFilter;
    if (testFilter === "real") orderWhere.isTest = false;
    else if (testFilter === "test") orderWhere.isTest = true;

    // Query v2 orders with people and line items
    const orders = await db.v2Order.findMany({
        where: orderWhere,
        orderBy: { createdAt: "asc" },
        select: {
            status: true,
            isPaid: true,
            totalPrice: true,
            variableSymbol: true,
            createdAt: true,
            people: {
                orderBy: { personIndex: "asc" },
                select: {
                    personIndex: true,
                    lineItems: {
                        select: {
                            value: true,
                            field: {
                                select: {
                                    name: true,
                                    type: true,
                                },
                            },
                            pricingOption: {
                                select: { name: true },
                            },
                        },
                    },
                },
            },
        },
    });

    // Build field name → label map and ordered field list
    const fieldNames = formStructure.fields.map(
        (f) => f.name,
    );
    const fieldTypeMap = new Map(
        formStructure.fields.map((f) => [f.name, f.type]),
    );

    // Apply field-value filter (post-query since it's on line item values)
    let filteredOrders = orders;
    if (fieldParam && valueParam) {
        filteredOrders = orders.filter((order) => {
            for (const person of order.people) {
                for (const li of person.lineItems) {
                    if (li.field.name !== fieldParam)
                        continue;
                    const displayVal = normalizeCheckboxValue(
                        li.pricingOption?.name ?? li.value ?? "",
                    );
                    if (displayVal === valueParam)
                        return true;
                }
            }
            return false;
        });
    }

    // Build CSV header
    const headers = [
        "Typ",
        ...formStructure.fields.flatMap((f) =>
            f.type === "birth_date"
                ? [f.label, "Nezletilý"]
                : [f.label],
        ),
        "Stav",
        "Zaplaceno",
        "Cena",
        "VS",
        "Datum registrace",
    ];

    // Build CSV rows
    const rows: string[][] = [];
    for (const order of filteredOrders) {
        for (const person of order.people) {
            const isMain = person.personIndex === 0;

            // Group line items by field name to handle multi-value fields
            const lineItemsByField = new Map<
                string,
                typeof person.lineItems
            >();
            for (const li of person.lineItems) {
                const name = li.field.name;
                if (!lineItemsByField.has(name))
                    lineItemsByField.set(name, []);
                lineItemsByField.get(name)!.push(li);
            }

            rows.push([
                isMain
                    ? "Hlavní"
                    : `Další osoba ${person.personIndex}`,
                ...fieldNames.flatMap((name) => {
                    if (
                        !isMain &&
                        !apFieldNames.has(name)
                    ) {
                        return fieldTypeMap.get(name) ===
                            "birth_date"
                            ? ["", ""]
                            : [""];
                    }
                    const items =
                        lineItemsByField.get(name) ?? [];
                    const val =
                        items.length > 1
                            ? items
                                  .map(
                                      (li) =>
                                          li.pricingOption
                                              ?.name ??
                                          li.value,
                                  )
                                  .filter(Boolean)
                                  .join(", ")
                            : (items[0]?.pricingOption
                                  ?.name ??
                              items[0]?.value ??
                              "");
                    const formatted =
                        normalizeCheckboxValue(val);
                    if (
                        fieldTypeMap.get(name) ===
                        "birth_date"
                    ) {
                        const minor = val
                            ? isMinor(val, refDate)
                            : false;
                        return [
                            formatted,
                            minor ? "Ano" : "Ne",
                        ];
                    }
                    return [formatted];
                }),
                isMain
                    ? (STATUS_LABELS[order.status] ??
                      order.status)
                    : "",
                isMain
                    ? order.isPaid
                        ? "Ano"
                        : "Ne"
                    : "",
                isMain && order.totalPrice != null
                    ? String(order.totalPrice)
                    : "",
                order.variableSymbol ?? "",
                isMain
                    ? formatDateTime(order.createdAt)
                    : "",
            ]);
        }
    }

    const BOM = "﻿";
    const csvContent =
        BOM +
        headers.map(escapeCsvValue).join(",") +
        "\n" +
        rows
            .map((row) =>
                row.map(escapeCsvValue).join(","),
            )
            .join("\n");

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="registrace-${year.year}.csv"`,
        },
    });
}
