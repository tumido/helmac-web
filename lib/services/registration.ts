import { cache } from "react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { OptionCounts, OptionPeople } from "@/lib/types/registration-form";
import type { StatFilter } from "@/lib/types/content-blocks";

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

// ---- v2 query helpers ----

interface V2Summary {
    registrations: number;
    confirmed: number;
    pending: number;
    waitlist: number;
    paidTotal: number;
    unpaidTotal: number;
    people: number;
}

interface V2OptionCountsResult {
    [fieldName: string]: {
        counts: Record<string, number>;
        capacityLimits: Record<string, number>;
    };
}

interface V2FormField {
    id: string;
    legacyId: string | null;
    name: string;
    label: string;
    type: string;
    pricingDefinitionId: string | null;
    options: string[];
    sortOrder: number;
}

interface V2PricingDef {
    id: string;
    name: string;
    options: { id: string; name: string }[];
}

interface V2FormStructure {
    fields: V2FormField[];
    pricingDefinitions: V2PricingDef[];
    capacityLimits: {
        id: string;
        fieldId: string;
        optionValue: string;
        maxCount: number;
    }[];
}

interface V2ValueRow {
    orderId: string;
    personId: string;
    fieldName: string;
    value: string;
}

async function queryV2Summary(
    yearId: string,
): Promise<V2Summary> {
    const rows = await db.$queryRaw<{ v2_get_registration_summary: V2Summary }[]>(
        Prisma.sql`SELECT v2_get_registration_summary(${yearId}) AS v2_get_registration_summary`,
    );
    return rows[0]?.v2_get_registration_summary ?? {
        registrations: 0,
        confirmed: 0,
        pending: 0,
        waitlist: 0,
        paidTotal: 0,
        unpaidTotal: 0,
        people: 0,
    };
}

async function queryV2OptionCounts(
    yearId: string,
    fieldNames?: string[] | null,
    statuses?: string[] | null,
    isPaid?: boolean | null,
): Promise<V2OptionCountsResult> {
    const rows = await db.$queryRaw<{ v2_get_option_counts: V2OptionCountsResult }[]>(
        Prisma.sql`SELECT v2_get_option_counts(
            ${yearId},
            ${fieldNames ?? Prisma.sql`NULL`}::text[],
            ${statuses ?? Prisma.sql`NULL`}::text[],
            ${isPaid ?? Prisma.sql`NULL`}::boolean
        ) AS v2_get_option_counts`,
    );
    return rows[0]?.v2_get_option_counts ?? {};
}

async function queryV2FormStructure(
    yearId: string,
): Promise<V2FormStructure | null> {
    const rows = await db.$queryRaw<{ v2_get_form_structure: V2FormStructure | null }[]>(
        Prisma.sql`SELECT v2_get_form_structure(${yearId}) AS v2_get_form_structure`,
    );
    return rows[0]?.v2_get_form_structure ?? null;
}

async function queryV2ValueRows(
    yearId: string,
    fieldNames: string[],
): Promise<V2ValueRow[]> {
    if (fieldNames.length === 0) return [];
    const rows = await db.$queryRaw<{ v2_get_value_rows: V2ValueRow[] }[]>(
        Prisma.sql`SELECT v2_get_value_rows(${yearId}, ${fieldNames}::text[]) AS v2_get_value_rows`,
    );
    return rows[0]?.v2_get_value_rows ?? [];
}

// ---- Build RegistrationStats from v2 data ----

function buildFieldStats(
    formStructure: V2FormStructure,
    optionCountsResult: V2OptionCountsResult,
    rawValueRows: V2ValueRow[],
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

    // Build pricing def lookup for option names
    const pricingDefById = new Map(
        formStructure.pricingDefinitions.map((d) => [d.id, d]),
    );

    // Build field ID → name lookup for capacity limits
    const fieldIdToName = new Map(
        formStructure.fields.map((f) => [f.id, f.name]),
    );

    // Build value rows grouped by personId (to produce per-person row records)
    const personValues = new Map<string, Record<string, string>>();
    for (const row of rawValueRows) {
        const key = row.personId;
        if (!personValues.has(key)) personValues.set(key, {});
        personValues.get(key)![row.fieldName] = row.value ?? "";
    }
    const valueRows = Array.from(personValues.values());

    for (const field of formStructure.fields) {
        fieldLabels[field.name] = field.label;

        // Build field options list
        const isPricing = PRICING_FIELD_TYPES.has(field.type);
        let opts: string[] = [];
        if (field.type === "checkbox") {
            opts = ["Ano", "Ne"];
        } else if (field.type === "select" || field.type === "radio") {
            opts = field.options ?? [];
        } else if (isPricing && field.pricingDefinitionId) {
            const pricingDef = pricingDefById.get(field.pricingDefinitionId);
            if (pricingDef) {
                opts = pricingDef.options.map((o) => o.name);
            }
        }
        if (opts.length > 0) fieldOptions[field.name] = opts;

        // Build FieldStatsData from v2 option counts
        const fieldCounts = optionCountsResult[field.name]?.counts ?? {};
        const total = Object.values(fieldCounts).reduce(
            (s, c) => s + c,
            0,
        );

        // Compute sum/average from value rows for numeric fields
        let numericSum = 0;
        let numericCount = 0;
        const fieldValues = valueRows.map((r) => r[field.name] ?? "");

        if (field.type === "number" || isPricing) {
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

    // Build capacity limits
    for (const cl of formStructure.capacityLimits) {
        const fieldName = fieldIdToName.get(cl.fieldId);
        if (!fieldName) continue;
        if (!capacityLimits[fieldName])
            capacityLimits[fieldName] = {};
        capacityLimits[fieldName][cl.optionValue] = cl.maxCount;
    }

    return { fields, fieldLabels, fieldOptions, capacityLimits, valueRows };
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countResult = await (db as any).v2Order.count({
        where: {
            yearId: activeYear.id,
            isTest: false,
            status: { notIn: ["CANCELLED", "REJECTED"] },
        },
    });

    return {
        isOpen: activeYear.registrationOpen,
        year: activeYear,
        registrationCount: countResult,
        registrationStartDate: activeYear.registrationStartDate,
        hasForm: !!activeYear.registrationForm,
        formFields: activeYear.registrationForm?.fields ?? null,
    };
});

export const getRegistrationStatsForYear = cache(
    async (yearId: string): Promise<RegistrationStats> => {
        const [summary, optionCounts, formStructure] =
            await Promise.all([
                queryV2Summary(yearId),
                queryV2OptionCounts(yearId),
                queryV2FormStructure(yearId),
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
        const rawValueRows = await queryV2ValueRows(
            yearId,
            fieldNames,
        );

        const { fields, fieldLabels, fieldOptions, capacityLimits, valueRows } =
            buildFieldStats(
                formStructure,
                optionCounts,
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

    // Field-name filters for scoping the option counts query
    const fieldFilterNames = filter.fieldFilters?.map(
        (f) => f.fieldName,
    );

    const [optionCounts, formStructure] = await Promise.all([
        queryV2OptionCounts(
            yearId,
            fieldFilterNames ?? null,
            statuses,
            isPaid,
        ),
        queryV2FormStructure(yearId),
    ]);

    // For filtered stats, query a custom summary matching the filters
    const statusFilter = statuses
        ? Prisma.sql`AND o.status = ANY(${statuses}::text[])`
        : Prisma.sql`AND o.status NOT IN ('CANCELLED', 'REJECTED')`;
    const paidFilter =
        isPaid !== null
            ? Prisma.sql`AND o.is_paid = ${isPaid}`
            : Prisma.empty;

    const summaryRows = await db.$queryRaw<{
        registrations: bigint;
        confirmed: bigint;
        pending: bigint;
        waitlist: bigint;
        paid_total: bigint;
        unpaid_total: bigint;
        people: bigint;
    }[]>(
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
            WHERE o.year_id = ${yearId}
                AND o.is_test = false
                AND o.parent_order_id IS NULL
                AND o.order_type = 'registration'
                ${statusFilter}
                ${paidFilter}
        `,
    );

    const summary = summaryRows[0] ?? {
        registrations: BigInt(0),
        confirmed: BigInt(0),
        pending: BigInt(0),
        waitlist: BigInt(0),
        paid_total: BigInt(0),
        unpaid_total: BigInt(0),
        people: BigInt(0),
    };

    if (!formStructure) {
        return {
            registrations: Number(summary.registrations),
            people: Number(summary.people),
            paid_total: Number(summary.paid_total),
            unpaid_total: Number(summary.unpaid_total),
            confirmed: Number(summary.confirmed),
            pending: Number(summary.pending),
            waitlist: Number(summary.waitlist),
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
    const rawValueRows = await queryV2ValueRows(
        yearId,
        fieldNames,
    );

    const { fields, fieldLabels, fieldOptions, capacityLimits, valueRows } =
        buildFieldStats(
            formStructure,
            optionCounts,
            rawValueRows,
        );

    return {
        registrations: Number(summary.registrations),
        people: Number(summary.people),
        paid_total: Number(summary.paid_total),
        unpaid_total: Number(summary.unpaid_total),
        confirmed: Number(summary.confirmed),
        pending: Number(summary.pending),
        waitlist: Number(summary.waitlist),
        fields,
        fieldLabels,
        fieldOptions,
        capacityLimits,
        valueRows,
    };
}

// ---- Simple queries (kept as Prisma ORM, still needed) ----

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

// ---- Option counts (v2) ----

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
    const result = await queryV2OptionCounts(yearId);
    const counts: OptionCounts = {};
    for (const [fieldName, data] of Object.entries(result)) {
        counts[fieldName] = data.counts;
    }
    return counts;
}

// ---- Option people (v2) ----

export const getOptionPeopleForYear = cache(
    async (
        yearId: string,
        personFieldName: string,
    ): Promise<OptionPeople> => {
        // Query line items with person data to build the option→people mapping
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const lineItems = await (db as any).v2OrderLineItem.findMany({
            where: {
                yearId,
                order: {
                    isTest: false,
                    status: { notIn: ["CANCELLED", "REJECTED"] },
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
