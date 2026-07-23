import { cache } from "react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { OptionCounts, OptionPeople } from "@/lib/types/registration-form";
import type { StatFilter } from "@/lib/types/content-blocks";
import {
    getRegistrationSummary,
    getOptionCounts,
    getFormStructure,
    getValueRows,
    getFilteredOrderSummary,
    countOrders,
} from "@/lib/services/v2";
import type { V2FormStructure, V2OptionCountsResult } from "@/lib/services/v2";

// ---- Types ----

export interface FieldStatsData {
    total: number;
    counts: Record<string, number>;
    sum: number;
    average: number;
    values: string[];
    isCurrency: boolean;
}

export interface RegistrationStats {
    registrations: number;
    people: number;
    paid_total: number;
    unpaid_total: number;
    confirmed: number;
    pending: number;
    waitlist: number;
    fields: Record<string, FieldStatsData>;
    fieldLabels: Record<string, string>;
    fieldOptions: Record<string, string[]>;
    capacityLimits: Record<string, Record<string, number>>;
    valueRows: Record<string, string>[];
}

const PRICING_FIELD_TYPES = new Set([
    "pricing_select",
    "pricing_multi_select",
    "pricing_quantity",
]);

// ---- Build RegistrationStats from v2 data ----

function buildFieldStats(
    formStructure: V2FormStructure,
    optionCountsResult: V2OptionCountsResult,
    rawValueRows: { personId: string; fieldName: string; value: string }[],
): {
    fields: Record<string, FieldStatsData>;
    fieldLabels: Record<string, string>;
    fieldOptions: Record<string, string[]>;
    capacityLimits: Record<string, Record<string, number>>;
    valueRows: Record<string, string>[];
} {
    const fields: Record<string, FieldStatsData> = {};
    const fieldLabels: Record<string, string> = {};
    const fieldOptions: Record<string, string[]> = {};
    const capacityLimits: Record<string, Record<string, number>> = {};

    const pricingDefById = new Map(
        formStructure.pricingDefinitions.map((d) => [d.id, d]),
    );
    const fieldIdToName = new Map(
        formStructure.fields.map((f) => [f.id, f.name]),
    );

    // Build field type lookup for checkbox filtering
    const fieldTypeMap = new Map(
        formStructure.fields.map((f) => [f.name, f.type]),
    );

    // Group value rows by personId to produce per-person records
    const personValues = new Map<string, Record<string, string[]>>();
    for (const row of rawValueRows) {
        const val = row.value ?? "";
        if (val === "false" && fieldTypeMap.get(row.fieldName) === "checkbox")
            continue;
        if (!personValues.has(row.personId))
            personValues.set(row.personId, {});
        const person = personValues.get(row.personId)!;
        if (!person[row.fieldName]) person[row.fieldName] = [];
        person[row.fieldName].push(val);
    }
    const valueRows = Array.from(personValues.values()).map(
        (person) => {
            const row: Record<string, string> = {};
            for (const [name, vals] of Object.entries(person)) {
                row[name] = vals.join(", ");
            }
            return row;
        },
    );

    for (const field of formStructure.fields) {
        fieldLabels[field.name] = field.label;

        const isPricing = PRICING_FIELD_TYPES.has(field.type);
        let opts: string[] = [];
        if (field.type === "checkbox") {
            opts = ["Ano", "Ne"];
        } else if (
            field.type === "select" ||
            field.type === "radio"
        ) {
            opts = field.options ?? [];
        } else if (isPricing && field.pricingDefinitionId) {
            const pricingDef = pricingDefById.get(
                field.pricingDefinitionId,
            );
            if (pricingDef) {
                opts = pricingDef.options.map((o) => o.name);
            }
        }
        if (opts.length > 0) fieldOptions[field.name] = opts;

        const fieldCounts =
            optionCountsResult[field.name]?.counts ?? {};

        const fieldValues = valueRows.map(
            (r) => r[field.name] ?? "",
        );
        // total = respondents with a non-empty value (not sum of quantities)
        const total = fieldValues.filter((v) => v !== "").length;

        let numericSum = 0;
        let numericCount = 0;

        if (field.type === "pricing_quantity") {
            // For pricing_quantity, option counts ARE quantities (SUM(oli.quantity))
            numericSum = Object.values(fieldCounts).reduce(
                (s, c) => s + c,
                0,
            );
            numericCount = total || 1;
        } else if (field.type === "number") {
            for (const val of fieldValues) {
                if (!val) continue;
                const num = Number(val);
                if (!isNaN(num)) {
                    numericSum += num;
                    numericCount++;
                }
            }
        }

        fields[field.name] = {
            total,
            counts: fieldCounts,
            sum: numericSum,
            average:
                numericCount > 0
                    ? Math.round(numericSum / numericCount)
                    : 0,
            values: fieldValues,
            isCurrency: isPricing,
        };
    }

    for (const cl of formStructure.capacityLimits) {
        const fieldName = fieldIdToName.get(cl.fieldId);
        if (!fieldName) continue;
        if (!capacityLimits[fieldName])
            capacityLimits[fieldName] = {};
        capacityLimits[fieldName][cl.optionValue] = cl.maxCount;
    }

    return {
        fields,
        fieldLabels,
        fieldOptions,
        capacityLimits,
        valueRows,
    };
}

// ---- Public API ----

export const getRegistrationStatus = cache(async () => {
    const activeYear = await db.year.findFirst({
        where: { isActive: true, isArchived: false },
        select: {
            id: true,
            year: true,
            title: true,
            startDate: true,
            endDate: true,
            registrationOpen: true,
            registrationStartDate: true,
            registrationSuccessContent: true,
            registrationForm: {
                select: { id: true, fields: true },
            },
        },
    });

    if (!activeYear) {
        return {
            isOpen: false,
            year: null,
            registrationCount: 0,
            registrationStartDate: null,
            hasForm: false,
            formFields: null,
        };
    }

    const registrationCount = await countOrders({
        yearId: activeYear.id,
    });

    return {
        isOpen: activeYear.registrationOpen,
        year: activeYear,
        registrationCount,
        registrationStartDate: activeYear.registrationStartDate,
        hasForm: !!activeYear.registrationForm,
        formFields: activeYear.registrationForm?.fields ?? null,
    };
});

export const getRegistrationStatsForYear = cache(
    async (yearId: string): Promise<RegistrationStats> => {
        const [summary, optionCountsResult, formStructure] =
            await Promise.all([
                getRegistrationSummary(yearId),
                getOptionCounts(yearId),
                getFormStructure(yearId),
            ]);

        if (!formStructure) {
            return {
                registrations: summary.registrations,
                people: summary.people,
                paid_total: summary.paidTotal,
                unpaid_total: summary.unpaidTotal,
                confirmed: summary.confirmed,
                pending: summary.pending,
                waitlist: summary.waitlist,
                fields: {},
                fieldLabels: {},
                fieldOptions: {},
                capacityLimits: {},
                valueRows: [],
            };
        }

        const fieldNames = formStructure.fields.map(
            (f) => f.name,
        );
        const rawValueRows = await getValueRows(
            yearId,
            fieldNames,
        );

        const {
            fields,
            fieldLabels,
            fieldOptions,
            capacityLimits,
            valueRows,
        } = buildFieldStats(
            formStructure,
            optionCountsResult,
            rawValueRows,
        );

        return {
            registrations: summary.registrations,
            people: summary.people,
            paid_total: summary.paidTotal,
            unpaid_total: summary.unpaidTotal,
            confirmed: summary.confirmed,
            pending: summary.pending,
            waitlist: summary.waitlist,
            fields,
            fieldLabels,
            fieldOptions,
            capacityLimits,
            valueRows,
        };
    },
);

export async function getFilteredRegistrationStats(
    yearId: string,
    filter?: StatFilter,
): Promise<RegistrationStats> {
    if (!filter) {
        return getRegistrationStatsForYear(yearId);
    }

    const statuses = filter.statuses?.length
        ? filter.statuses
        : null;
    const isPaid = filter.isPaid ?? null;
    const hasFieldValueFilters =
        filter.fieldFilters && filter.fieldFilters.length > 0;

    const fieldFilterNames = filter.fieldFilters?.map(
        (f) => f.fieldName,
    );

    const [optionCountsResult, formStructure] =
        await Promise.all([
            getOptionCounts(
                yearId,
                fieldFilterNames ?? null,
                statuses,
                isPaid,
            ),
            getFormStructure(yearId),
        ]);

    if (!formStructure) {
        const summary = await getFilteredOrderSummary(
            yearId, statuses, isPaid,
        );
        return {
            registrations: summary.registrations,
            people: summary.people,
            paid_total: summary.paidTotal,
            unpaid_total: summary.unpaidTotal,
            confirmed: summary.confirmed,
            pending: summary.pending,
            waitlist: summary.waitlist,
            fields: {},
            fieldLabels: {},
            fieldOptions: {},
            capacityLimits: {},
            valueRows: [],
        };
    }

    const fieldNames = formStructure.fields.map(
        (f) => f.name,
    );
    let rawValueRows = await getValueRows(
        yearId,
        fieldNames,
    );

    // When field-value filters exist, filter rawValueRows to only include
    // orders where at least one person matches ALL field-value pairs.
    let matchingOrderIds: string[] | null = null;
    if (hasFieldValueFilters) {
        const orderPersonRows = new Map<string, Map<string, Set<string>>>();
        for (const row of rawValueRows) {
            if (!orderPersonRows.has(row.orderId))
                orderPersonRows.set(row.orderId, new Map());
            const persons = orderPersonRows.get(row.orderId)!;
            if (!persons.has(row.personId))
                persons.set(row.personId, new Set());
            persons.get(row.personId)!.add(
                `${row.fieldName}\0${row.value}`,
            );
        }

        matchingOrderIds = [];
        for (const [orderId, persons] of orderPersonRows) {
            let orderMatches = false;
            for (const values of persons.values()) {
                const personMatches = filter.fieldFilters!.every(
                    (ff) => values.has(`${ff.fieldName}\0${ff.value}`),
                );
                if (personMatches) {
                    orderMatches = true;
                    break;
                }
            }
            if (orderMatches) matchingOrderIds.push(orderId);
        }

        rawValueRows = rawValueRows.filter(
            (r) => matchingOrderIds!.includes(r.orderId),
        );
    }

    const {
        fields,
        fieldLabels,
        fieldOptions,
        capacityLimits,
        valueRows,
    } = buildFieldStats(
        formStructure,
        optionCountsResult,
        rawValueRows,
    );

    // Compute summary — when field-value filters exist, recompute from
    // the matching orders only instead of using the broad SQL summary.
    let summary;
    if (matchingOrderIds !== null && matchingOrderIds.length > 0) {
        summary = await getOrderSummaryByIds(
            matchingOrderIds, statuses, isPaid,
        );
    } else if (matchingOrderIds !== null) {
        summary = {
            registrations: 0, confirmed: 0, pending: 0, waitlist: 0,
            paidTotal: 0, unpaidTotal: 0, people: 0,
        };
    } else {
        summary = await getFilteredOrderSummary(
            yearId, statuses, isPaid,
        );
    }

    return {
        registrations: summary.registrations,
        people: summary.people,
        paid_total: summary.paidTotal,
        unpaid_total: summary.unpaidTotal,
        confirmed: summary.confirmed,
        pending: summary.pending,
        waitlist: summary.waitlist,
        fields,
        fieldLabels,
        fieldOptions,
        capacityLimits,
        valueRows,
    };
}

async function getOrderSummaryByIds(
    orderIds: string[],
    statuses: string[] | null,
    isPaid: boolean | null,
): Promise<{
    registrations: number;
    confirmed: number;
    pending: number;
    waitlist: number;
    paidTotal: number;
    unpaidTotal: number;
    people: number;
}> {
    const statusFilter = statuses
        ? Prisma.sql`AND o.status = ANY(${statuses}::text[])`
        : Prisma.sql`AND o.status NOT IN ('CANCELLED', 'REJECTED')`;
    const paidFilter =
        isPaid !== null
            ? Prisma.sql`AND o.is_paid = ${isPaid}`
            : Prisma.empty;

    const rows = await db.$queryRaw<
        {
            registrations: bigint;
            confirmed: bigint;
            pending: bigint;
            waitlist: bigint;
            paid_total: bigint;
            unpaid_total: bigint;
            people: bigint;
        }[]
    >(
        Prisma.sql`
            SELECT
                COUNT(*) AS registrations,
                COUNT(*) FILTER (WHERE o.status = 'CONFIRMED') AS confirmed,
                COUNT(*) FILTER (WHERE o.status = 'PENDING') AS pending,
                COUNT(*) FILTER (WHERE o.status = 'WAITLIST') AS waitlist,
                COALESCE(SUM(o.total_price) FILTER (WHERE o.is_paid), 0) AS paid_total,
                COALESCE(SUM(o.total_price) FILTER (WHERE NOT o.is_paid), 0) AS unpaid_total,
                COALESCE((
                    SELECT COUNT(DISTINCT op.id)
                    FROM v2_order_people op
                    WHERE op.order_id = ANY(ARRAY_AGG(o.id))
                ), 0) AS people
            FROM v2_orders o
            WHERE o.id = ANY(${orderIds}::text[])
                AND o.is_test = false
                AND o.parent_order_id IS NULL
                AND o.order_type = 'registration'
                ${statusFilter}
                ${paidFilter}
        `,
    );

    const row = rows[0];
    if (!row) {
        return {
            registrations: 0, confirmed: 0, pending: 0, waitlist: 0,
            paidTotal: 0, unpaidTotal: 0, people: 0,
        };
    }
    return {
        registrations: Number(row.registrations),
        confirmed: Number(row.confirmed),
        pending: Number(row.pending),
        waitlist: Number(row.waitlist),
        paidTotal: Number(row.paid_total),
        unpaidTotal: Number(row.unpaid_total),
        people: Number(row.people),
    };
}

// ---- Simple queries ----

export const getRegistrationFormForYear = cache(
    async (yearId: string) => {
        return db.registrationForm.findUnique({
            where: { yearId },
            select: {
                id: true,
                fields: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    },
);

export const getSubmissionsForYear = cache(
    async (yearId: string) => {
        return db.registrationSubmission.findMany({
            where: { yearId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                data: true,
                status: true,
                isPaid: true,
                paidAt: true,
                totalPrice: true,
                variableSymbol: true,
                createdAt: true,
            },
        });
    },
);

export const getSubmissionById = cache(
    async (id: string) => {
        return db.registrationSubmission.findUnique({
            where: { id },
            select: {
                id: true,
                yearId: true,
                formId: true,
                data: true,
                status: true,
                isPaid: true,
                paidAt: true,
                pricingSummary: true,
                variableSymbol: true,
                totalPrice: true,
                emailSent: true,
                emailSentAt: true,
                adminNote: true,
                isTest: true,
                createdAt: true,
                updatedAt: true,
                form: {
                    select: { fields: true },
                },
                year: {
                    select: { year: true, title: true },
                },
            },
        });
    },
);

export const getSubmissionCountForYear = cache(
    async (yearId: string) => {
        return db.registrationSubmission.count({
            where: { yearId, isTest: false },
        });
    },
);

// ---- Option counts ----

export const getOptionCountsForYear = cache(
    async (yearId: string): Promise<OptionCounts> => {
        return computeOptionCounts(yearId);
    },
);

export async function getOptionCountsForYearFresh(
    yearId: string,
): Promise<OptionCounts> {
    return computeOptionCounts(yearId);
}

async function computeOptionCounts(
    yearId: string,
): Promise<OptionCounts> {
    const result = await getOptionCounts(yearId);
    const counts: OptionCounts = {};
    for (const [fieldName, data] of Object.entries(result)) {
        counts[fieldName] = data.counts;
    }
    return counts;
}

// ---- Option people ----

export const getOptionPeopleForYear = cache(
    async (
        yearId: string,
        personFieldName: string,
    ): Promise<OptionPeople> => {
        const lineItems = await db.v2OrderLineItem.findMany({
            where: {
                yearId,
                order: {
                    isTest: false,
                    status: {
                        notIn: ["CANCELLED", "REJECTED"],
                    },
                },
            },
            select: {
                value: true,
                person: {
                    select: {
                        id: true,
                        lineItems: {
                            where: {
                                field: { name: personFieldName },
                            },
                            select: { value: true },
                            take: 1,
                        },
                    },
                },
                field: { select: { name: true } },
            },
        });

        const people: OptionPeople = {};
        for (const li of lineItems) {
            const fieldName = li.field.name;
            const value = li.value;
            if (!value || value === "false") continue;

            const personLabel =
                li.person.lineItems[0]?.value ?? "";
            if (!personLabel) continue;

            if (!people[fieldName]) people[fieldName] = {};
            if (!people[fieldName][value])
                people[fieldName][value] = [];
            people[fieldName][value].push(personLabel);
        }
        return people;
    },
);
