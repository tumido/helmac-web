import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getApplicablePriceFromSummary } from "@/lib/utils/pricing";
import type { PricingSummaryData } from "@/lib/types/registration-form";

// ============================================================
// Types — v2 DB function return shapes
// ============================================================

export interface V2Summary {
    registrations: number;
    confirmed: number;
    pending: number;
    waitlist: number;
    paidTotal: number;
    unpaidTotal: number;
    people: number;
}

export interface V2OptionCountsResult {
    [fieldName: string]: {
        counts: Record<string, number>;
        capacityLimits: Record<string, number>;
    };
}

export interface V2FormField {
    id: string;
    legacyId: string | null;
    name: string;
    label: string;
    type: string;
    pricingDefinitionId: string | null;
    options: string[];
    sortOrder: number;
}

export interface V2PricingDef {
    id: string;
    name: string;
    options: { id: string; name: string }[];
}

export interface V2FormStructure {
    fields: V2FormField[];
    pricingDefinitions: V2PricingDef[];
    capacityLimits: {
        id: string;
        fieldId: string;
        optionValue: string;
        maxCount: number;
    }[];
}

export interface V2ValueRow {
    orderId: string;
    personId: string;
    fieldName: string;
    value: string;
}

export interface V2CapacityCheck {
    maxCount: number;
    currentCount: number;
    remaining: number;
    wouldExceed: boolean;
}

// ============================================================
// v2 DB function wrappers
// ============================================================

export async function getRegistrationSummary(
    yearId: string,
): Promise<V2Summary> {
    const rows = await db.$queryRaw<
        { v2_get_registration_summary: V2Summary }[]
    >(
        Prisma.sql`SELECT v2_get_registration_summary(${yearId}) AS v2_get_registration_summary`,
    );
    return (
        rows[0]?.v2_get_registration_summary ?? {
            registrations: 0,
            confirmed: 0,
            pending: 0,
            waitlist: 0,
            paidTotal: 0,
            unpaidTotal: 0,
            people: 0,
        }
    );
}

export async function getOptionCounts(
    yearId: string,
    fieldNames?: string[] | null,
    statuses?: string[] | null,
    isPaid?: boolean | null,
): Promise<V2OptionCountsResult> {
    const rows = await db.$queryRaw<
        { v2_get_option_counts: V2OptionCountsResult }[]
    >(
        Prisma.sql`SELECT v2_get_option_counts(
            ${yearId},
            ${fieldNames ?? Prisma.sql`NULL`}::text[],
            ${statuses ?? Prisma.sql`NULL`}::text[],
            ${isPaid ?? Prisma.sql`NULL`}::boolean
        ) AS v2_get_option_counts`,
    );
    return rows[0]?.v2_get_option_counts ?? {};
}

export async function getFormStructure(
    yearId: string,
): Promise<V2FormStructure | null> {
    const rows = await db.$queryRaw<
        { v2_get_form_structure: V2FormStructure | null }[]
    >(
        Prisma.sql`SELECT v2_get_form_structure(${yearId}) AS v2_get_form_structure`,
    );
    return rows[0]?.v2_get_form_structure ?? null;
}

export async function getValueRows(
    yearId: string,
    fieldNames: string[],
): Promise<V2ValueRow[]> {
    if (fieldNames.length === 0) return [];
    const rows = await db.$queryRaw<
        { v2_get_value_rows: V2ValueRow[] }[]
    >(
        Prisma.sql`SELECT v2_get_value_rows(${yearId}, ${fieldNames}::text[]) AS v2_get_value_rows`,
    );
    return rows[0]?.v2_get_value_rows ?? [];
}

export async function computeCurrentTotal(
    orderId: string,
): Promise<number> {
    const rows = await db.$queryRaw<
        { v2_compute_current_total: number }[]
    >(
        Prisma.sql`SELECT v2_compute_current_total(${orderId}) AS v2_compute_current_total`,
    );
    return rows[0]?.v2_compute_current_total ?? 0;
}

export async function checkCapacity(
    yearId: string,
    fieldName: string,
    optionValue: string,
    additional: number,
): Promise<V2CapacityCheck | null> {
    const rows = await db.$queryRaw<V2CapacityCheck[]>(
        Prisma.sql`SELECT
            max_count AS "maxCount",
            current_count AS "currentCount",
            remaining,
            would_exceed AS "wouldExceed"
        FROM v2_check_capacity(
            ${yearId}, ${fieldName}, ${optionValue}, ${additional}::int
        )`,
    );
    return rows[0] ?? null;
}

export async function findDuplicateEmail(
    yearId: string,
    emailFieldName: string,
    emailValue: string,
): Promise<boolean> {
    const rows = await db.$queryRaw<{ id: string }[]>(
        Prisma.sql`
            SELECT oli.id FROM v2_order_line_items oli
            JOIN v2_form_fields ff ON ff.id = oli.field_id
            JOIN v2_orders o ON o.id = oli.order_id
            JOIN v2_order_people op ON op.id = oli.person_id
            WHERE oli.year_id = ${yearId}
                AND ff.name = ${emailFieldName}
                AND LOWER(oli.value) = ${emailValue}
                AND o.order_type = 'registration'
                AND o.is_test = false
                AND o.status NOT IN ('CANCELLED', 'REJECTED')
                AND op.person_index = 0
            LIMIT 1
        `,
    );
    return rows.length > 0;
}

// ============================================================
// v2 model queries (typed wrappers around Prisma ORM)
// ============================================================

export async function countOrders(where: {
    yearId: string;
    isTest?: boolean;
    statusNotIn?: string[];
}): Promise<number> {
    return db.v2Order.count({
        where: {
            yearId: where.yearId,
            isTest: where.isTest ?? false,
            parentOrderId: null,
            orderType: "registration",
            status: {
                notIn: where.statusNotIn ?? [
                    "CANCELLED",
                    "REJECTED",
                ],
            },
        },
    });
}

export async function getUnpaidOrders(
): Promise<
    {
        id: string;
        yearId: string;
        totalPrice: number | null;
        variableSymbol: string | null;
        legacySubmissionId: string | null;
    }[]
> {
    return db.v2Order.findMany({
        where: {
            isPaid: false,
            isTest: false,
            status: { notIn: ["CANCELLED", "REJECTED"] },
            parentOrderId: null,
            orderType: "registration",
        },
        select: {
            id: true,
            yearId: true,
            totalPrice: true,
            variableSymbol: true,
            legacySubmissionId: true,
        },
    });
}

export async function updateOrderTotalPrice(
    orderId: string,
    legacySubmissionId: string | null,
    totalPrice: number,
): Promise<void> {
    await db.$transaction(async (tx) => {
        await tx.v2Order.update({
            where: { id: orderId },
            data: { totalPrice },
        });
        if (legacySubmissionId) {
            const sub = await tx.registrationSubmission.findUnique({
                where: { id: legacySubmissionId },
                select: { pricingSummary: true },
            });
            const pricingSummary = sub?.pricingSummary as unknown as PricingSummaryData | null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const updateData: Record<string, any> = { totalPrice };
            if (pricingSummary?.tiers) {
                const { applicableTierIndex } =
                    getApplicablePriceFromSummary(pricingSummary);
                updateData.pricingSummary = {
                    ...pricingSummary,
                    applicableTierIndex,
                    totalPrice,
                } as unknown as Prisma.InputJsonValue;
            }
            await tx.registrationSubmission.update({
                where: { id: legacySubmissionId },
                data: updateData,
            });
        }
    });
}

export async function getFilteredOrderSummary(
    yearId: string,
    statuses: string[] | null,
    isPaid: boolean | null,
): Promise<V2Summary> {
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
            WHERE o.year_id = ${yearId}
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
            registrations: 0,
            confirmed: 0,
            pending: 0,
            waitlist: 0,
            paidTotal: 0,
            unpaidTotal: 0,
            people: 0,
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
