/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — Prisma-generated v2 model delegates are not visible to tsc outside the Next.js build scope
import { PrismaClient } from "@prisma/client";
import { migrateFormData } from "../../lib/utils/form-migration";
import type {
    InputField,
    PricingSummaryData,
    PricingDefinition,
} from "../../lib/types/registration-form";
import {
    parseQuantities,
    parseSelected,
} from "../../lib/utils/pricing-field-values";

const DRY_RUN = process.argv.includes("--dry-run");
const prisma = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any;

// ---- Cached maps per form ----

interface FormMaps {
    fieldNameToV2: Map<string, { id: string; type: string }>;
    optionLegacyToV2: Map<string, { id: string; name: string; definitionId: string }>;
    optionNameByDef: Map<string, Map<string, { id: string; name: string }>>;
    defLegacyToV2: Map<string, string>;
    tiers: { id: string; sortOrder: number; deadline: Date | null }[];
    tierPrices: Map<string, Map<string, number>>;
    inputFields: InputField[];
    pricingDefinitions: PricingDefinition[];
    priceTierDates: string[];
}

const formMapsCache = new Map<string, FormMaps>();

async function getFormMaps(formId: string): Promise<FormMaps | null> {
    const cached = formMapsCache.get(formId);
    if (cached) return cached;

    const form = await prisma.registrationForm.findUnique({
        where: { id: formId },
        select: { fields: true },
    });
    if (!form) return null;

    const formData = migrateFormData(form.fields);

    // Include inactive fields/options — submissions may reference
    // fields that were later removed from the form
    const v2Fields = await prisma.v2FormField.findMany({
        where: { formId },
        include: { pricingDefinition: true },
    });
    const fieldNameToV2 = new Map(
        v2Fields.map((f) => [f.name, { id: f.id, type: f.type }]),
    );

    // Build inputFields from v2 (includes inactive) rather than from
    // the current JSON blob (which only has active fields)
    const inputFields: InputField[] = v2Fields.map((f) => ({
        type: f.type as InputField["type"],
        id: f.legacyId ?? f.id,
        name: f.name,
        label: f.label,
        required: f.required,
        editable: f.editable,
        options: f.options,
        pricingId: f.pricingDefinition?.legacyId ?? f.pricingDefinitionId ?? undefined,
        includeForAdditionalPeople: f.includeForAdditionalPeople,
    }));

    const v2Options = await prisma.v2PricingOption.findMany({
        where: { definition: { formId } },
        select: { id: true, legacyId: true, name: true, definitionId: true },
    });
    const optionLegacyToV2 = new Map(
        v2Options
            .filter((o) => o.legacyId)
            .map((o) => [o.legacyId!, { id: o.id, name: o.name, definitionId: o.definitionId }]),
    );
    // Scope name lookup per definition to avoid collisions
    // when different definitions share option names (e.g. "Ano", "Ne")
    const optionNameByDef = new Map<string, Map<string, { id: string; name: string }>>();
    for (const o of v2Options) {
        if (!optionNameByDef.has(o.definitionId)) {
            optionNameByDef.set(o.definitionId, new Map());
        }
        optionNameByDef.get(o.definitionId)!.set(o.name, { id: o.id, name: o.name });
    }

    const tiers = await prisma.v2PriceTier.findMany({
        where: { formId },
        orderBy: { sortOrder: "asc" },
    });

    // Pre-load all prices in a single query
    const allPrices = await prisma.v2PricingOptionPrice.findMany({
        where: { tierId: { in: tiers.map((t) => t.id) } },
    });
    const tierPrices = new Map<string, Map<string, number>>();
    for (const tier of tiers) {
        tierPrices.set(tier.id, new Map());
    }
    for (const p of allPrices) {
        tierPrices.get(p.tierId)?.set(p.optionId, p.price);
    }

    // Build pricing definitions from v2 (includes inactive) for
    // usePriceTiers resolution in getOptionPriceForSubmission
    const v2Defs = await prisma.v2PricingDefinition.findMany({
        where: { formId },
    });
    const pricingDefinitions: PricingDefinition[] = v2Defs.map((d) => ({
        id: d.legacyId ?? d.id,
        name: d.name,
        type: (d.type ?? "options") as "options" | "quantity",
        multiSelect: d.multiSelect,
        usePriceTiers: d.usePriceTiers,
        options: v2Options
            .filter((o) => o.definitionId === d.id)
            .map((o) => ({
                id: o.legacyId ?? o.id,
                name: o.name,
                description: "",
                prices: [],
            })),
    }));

    const defLegacyToV2 = new Map(
        v2Defs
            .filter((d) => d.legacyId)
            .map((d) => [d.legacyId!, d.id]),
    );

    const maps: FormMaps = {
        fieldNameToV2,
        optionLegacyToV2,
        optionNameByDef,
        defLegacyToV2,
        tiers,
        tierPrices,
        inputFields,
        pricingDefinitions,
        priceTierDates: formData.priceTiers ?? [],
    };
    formMapsCache.set(formId, maps);
    return maps;
}

// ---- Per-option price resolution ----

// Resolve the v2 tier that matches a pricingSummary snapshot tier.
// Match by deadline date (not by array index) since the v2 tiers
// may have been merged/reordered by the catalog backfill.
function resolveV2Tier(
    maps: FormMaps,
    pricingSummary: PricingSummaryData | null,
): { id: string; deadline: Date | null } | null {
    if (!pricingSummary || pricingSummary.applicableTierIndex == null) {
        return maps.tiers.find((t) => !t.deadline) ?? null;
    }

    const snapshotTier = pricingSummary.tiers[pricingSummary.applicableTierIndex];
    if (!snapshotTier) {
        return maps.tiers.find((t) => !t.deadline) ?? null;
    }

    if (snapshotTier.tierDate === null) {
        return maps.tiers.find((t) => !t.deadline) ?? null;
    }

    const snapshotDateStr = snapshotTier.tierDate.slice(0, 10);
    const matched = maps.tiers.find((t) => {
        if (!t.deadline) return false;
        return t.deadline.toISOString().slice(0, 10) === snapshotDateStr;
    });

    return matched ?? maps.tiers.find((t) => !t.deadline) ?? null;
}

// Resolve the unit price for an option using the same logic as
// computePricingSummary: per-definition tier resolution.
function getOptionPriceForSubmission(
    maps: FormMaps,
    field: InputField,
    optionV2Id: string,
    pricingSummary: PricingSummaryData | null,
): number {
    const def = maps.pricingDefinitions.find(
        (d) => d.id === field.pricingId,
    );
    if (!def) return 0;

    // Non-tiered definitions always use a single flat price.
    // The catalog backfill may store it on only the first tier
    // (sortOrder 0), while the dual-write stores it on all tiers.
    // Search all tiers for the first non-zero price.
    if (!def.usePriceTiers) {
        for (const tier of maps.tiers) {
            const price = maps.tierPrices.get(tier.id)?.get(optionV2Id);
            if (price !== undefined && price !== 0) return price;
        }
        return maps.tierPrices.get(maps.tiers[0]?.id)?.get(optionV2Id) ?? 0;
    }

    // Tiered definitions: match the snapshot tier by deadline date
    const tier = resolveV2Tier(maps, pricingSummary);
    if (tier) {
        return maps.tierPrices.get(tier.id)?.get(optionV2Id) ?? 0;
    }
    return 0;
}

// ---- Line item resolution ----

interface LineItemData {
    pricingOptionId: string | null;
    value: string | null;
    quantity: number;
    unitPriceAtSubmission: number;
}

function resolveV2Option(
    maps: FormMaps,
    field: InputField,
    optionKey: string,
): { id: string; name: string } | undefined {
    const byLegacy = maps.optionLegacyToV2.get(optionKey);
    if (byLegacy) return byLegacy;

    // Fall back to name lookup scoped to this field's pricing
    // definition to avoid collisions (e.g. "Ano" in two defs)
    if (!field.pricingId) return undefined;
    const v2DefId = maps.defLegacyToV2.get(field.pricingId);
    if (!v2DefId) return undefined;
    return maps.optionNameByDef.get(v2DefId)?.get(optionKey);
}

function resolveLineItems(
    field: InputField,
    rawValue: unknown,
    maps: FormMaps,
    pricingSummary: PricingSummaryData | null,
): LineItemData[] {
    if (field.type === "pricing_select") {
        const optionId = String(rawValue);
        const v2Opt = resolveV2Option(maps, field, optionId);
        if (v2Opt) {
            return [{
                pricingOptionId: v2Opt.id,
                value: v2Opt.name,
                quantity: 1,
                unitPriceAtSubmission: getOptionPriceForSubmission(
                    maps, field, v2Opt.id, pricingSummary,
                ),
            }];
        }
        return [{
            pricingOptionId: null,
            value: optionId,
            quantity: 1,
            unitPriceAtSubmission: 0,
        }];
    }

    if (field.type === "pricing_multi_select") {
        const selected = parseSelected(rawValue);
        const items: LineItemData[] = [];
        for (const optId of selected) {
            const v2Opt = resolveV2Option(maps, field, optId);
            if (v2Opt) {
                items.push({
                    pricingOptionId: v2Opt.id,
                    value: v2Opt.name,
                    quantity: 1,
                    unitPriceAtSubmission: getOptionPriceForSubmission(
                        maps, field, v2Opt.id, pricingSummary,
                    ),
                });
            }
        }
        return items.length > 0
            ? items
            : [{ pricingOptionId: null, value: String(rawValue), quantity: 1, unitPriceAtSubmission: 0 }];
    }

    if (field.type === "pricing_quantity") {
        const quantities = parseQuantities(rawValue);
        const items: LineItemData[] = [];
        for (const [optId, qty] of Object.entries(quantities)) {
            if (qty <= 0) continue;
            const v2Opt = resolveV2Option(maps, field, optId);
            if (v2Opt) {
                items.push({
                    pricingOptionId: v2Opt.id,
                    value: v2Opt.name,
                    quantity: qty,
                    unitPriceAtSubmission: getOptionPriceForSubmission(
                        maps, field, v2Opt.id, pricingSummary,
                    ),
                });
            }
        }
        return items.length > 0
            ? items
            : [{ pricingOptionId: null, value: String(rawValue), quantity: 1, unitPriceAtSubmission: 0 }];
    }

    // Non-priced field
    return [{
        pricingOptionId: null,
        value: String(rawValue ?? ""),
        quantity: 1,
        unitPriceAtSubmission: 0,
    }];
}

// ---- Backfill ----

interface DryRunStats {
    orders: number;
    people: number;
    lineItems: number;
    bankLinked: number;
    skipped: number;
    priceMismatches: number;
}

async function backfillSubmission(
    tx: TxClient,
    sub: {
        id: string;
        yearId: string;
        formId: string;
        publicUserId: string | null;
        data: unknown;
        status: string;
        isPaid: boolean;
        paidAt: Date | null;
        totalPrice: number | null;
        variableSymbol: string | null;
        emailSent: boolean;
        emailSentAt: Date | null;
        adminNote: string | null;
        gdprConsentAt: Date | null;
        isTest: boolean;
        pricingSummary: unknown;
        createdAt: Date;
        updatedAt: Date;
    },
    maps: FormMaps,
): Promise<{ people: number; lineItems: number; bankLinked: number; priceMismatch: boolean }> {
    const data = sub.data as Record<string, unknown>;
    const pricingSummary = sub.pricingSummary as PricingSummaryData | null;

    // Idempotent: delete existing v2 data for this submission
    await tx.v2Order.deleteMany({ where: { legacySubmissionId: sub.id } });

    // 1. Create v2_orders (don't set updatedAt — let @updatedAt handle it
    // to avoid Prisma overriding the explicit value)
    const order = await tx.v2Order.create({
        data: {
            yearId: sub.yearId,
            formId: sub.formId,
            publicUserId: sub.publicUserId,
            orderType: "registration",
            status: sub.status,
            isPaid: sub.isPaid,
            paidAt: sub.paidAt,
            totalPrice: sub.totalPrice,
            variableSymbol: sub.variableSymbol,
            emailSent: sub.emailSent,
            emailSentAt: sub.emailSentAt,
            adminNote: sub.adminNote,
            gdprConsentAt: sub.gdprConsentAt,
            isTest: sub.isTest,
            legacySubmissionId: sub.id,
            createdAt: sub.createdAt,
        },
    });

    // 2. Create main person + line items
    const mainPerson = await tx.v2OrderPerson.create({
        data: {
            orderId: order.id,
            personIndex: 0,
            createdAt: sub.createdAt,
        },
    });

    let totalLineItems = 0;
    let totalPeople = 1;
    let lineItemPriceSum = 0;

    for (const field of maps.inputFields) {
        const v2Field = maps.fieldNameToV2.get(field.name);
        if (!v2Field) continue;

        const rawValue = data[field.name];
        if (rawValue === undefined || rawValue === null) continue;

        const items = resolveLineItems(field, rawValue, maps, pricingSummary);
        for (const li of items) {
            await tx.v2OrderLineItem.create({
                data: {
                    personId: mainPerson.id,
                    orderId: order.id,
                    yearId: sub.yearId,
                    fieldId: v2Field.id,
                    pricingOptionId: li.pricingOptionId,
                    value: li.value,
                    quantity: li.quantity,
                    unitPriceAtSubmission: li.unitPriceAtSubmission,
                },
            });
            totalLineItems++;
            lineItemPriceSum += li.unitPriceAtSubmission * li.quantity;
        }
    }

    // 3. Additional people
    const ap = data.additionalPeople;
    if (Array.isArray(ap)) {
        for (let pi = 0; pi < ap.length; pi++) {
            const personData = ap[pi] as Record<string, unknown>;
            const childPerson = await tx.v2OrderPerson.create({
                data: {
                    orderId: order.id,
                    personIndex: pi + 1,
                    createdAt: sub.createdAt,
                },
            });
            totalPeople++;

            for (const field of maps.inputFields) {
                if (!field.includeForAdditionalPeople) continue;
                const v2Field = maps.fieldNameToV2.get(field.name);
                if (!v2Field) continue;

                const rawValue = personData[field.name];
                if (rawValue === undefined || rawValue === null) continue;

                const items = resolveLineItems(field, rawValue, maps, pricingSummary);
                for (const li of items) {
                    await tx.v2OrderLineItem.create({
                        data: {
                            personId: childPerson.id,
                            orderId: order.id,
                            yearId: sub.yearId,
                            fieldId: v2Field.id,
                            pricingOptionId: li.pricingOptionId,
                            value: li.value,
                            quantity: li.quantity,
                            unitPriceAtSubmission: li.unitPriceAtSubmission,
                        },
                    });
                    totalLineItems++;
                    lineItemPriceSum += li.unitPriceAtSubmission * li.quantity;
                }
            }
        }
    }

    // 4. Per-order price assertion
    const expectedTotal = sub.totalPrice ?? 0;
    const priceMismatch = expectedTotal !== lineItemPriceSum;
    if (priceMismatch) {
        console.warn(
            `  MISMATCH: ${sub.id} totalPrice=${expectedTotal} lineItemSum=${lineItemPriceSum} (diff=${lineItemPriceSum - expectedTotal})`,
        );
    }

    // 5. Link bank transactions
    const bankResult = await tx.bankTransaction.updateMany({
        where: { submissionId: sub.id },
        data: { orderId: order.id },
    });

    return {
        people: totalPeople,
        lineItems: totalLineItems,
        bankLinked: bankResult.count,
        priceMismatch,
    };
}

// ---- Verification ----

async function verify(): Promise<void> {
    console.log("\n=== Verification ===");

    const submissionCount = await prisma.registrationSubmission.count();
    const orderCount = await prisma.v2Order.count();
    console.log(`  Submissions: ${submissionCount}`);
    console.log(`  V2 Orders: ${orderCount}`);
    if (submissionCount !== orderCount) {
        console.warn(
            `  WARNING: count mismatch (${submissionCount} submissions vs ${orderCount} orders)`,
        );
    }

    const peopleCount = await prisma.v2OrderPerson.count();
    const lineItemCount = await prisma.v2OrderLineItem.count();
    console.log(`  V2 Order People: ${peopleCount}`);
    console.log(`  V2 Order Line Items: ${lineItemCount}`);

    // Check bank transaction linkage
    const bankWithSub = await prisma.bankTransaction.count({
        where: { submissionId: { not: null } },
    });
    const bankWithOrder = await prisma.bankTransaction.count({
        where: { orderId: { not: null } },
    });
    console.log(`  Bank transactions with submissionId: ${bankWithSub}`);
    console.log(`  Bank transactions with orderId: ${bankWithOrder}`);
    if (bankWithSub !== bankWithOrder) {
        console.warn(
            `  WARNING: ${bankWithSub - bankWithOrder} bank transaction(s) not linked to v2 orders`,
        );
    }

    // Full price reconciliation across all orders
    const orders = await prisma.v2Order.findMany({
        where: { totalPrice: { not: null } },
        select: {
            id: true,
            totalPrice: true,
            legacySubmissionId: true,
            lineItems: {
                select: { unitPriceAtSubmission: true, quantity: true },
            },
        },
    });

    let mismatches = 0;
    for (const order of orders) {
        const lineItemTotal = order.lineItems.reduce(
            (sum: number, li: { unitPriceAtSubmission: number; quantity: number }) =>
                sum + li.unitPriceAtSubmission * li.quantity,
            0,
        );
        if (lineItemTotal !== order.totalPrice) {
            console.warn(
                `  Price mismatch: order ${order.id} (legacy: ${order.legacySubmissionId}) ` +
                    `totalPrice=${order.totalPrice} vs lineItems=${lineItemTotal}`,
            );
            mismatches++;
        }
    }
    if (mismatches === 0) {
        console.log(
            `  Price reconciliation: all ${orders.length} orders OK`,
        );
    } else {
        console.warn(
            `  Price reconciliation: ${mismatches} MISMATCH(ES) out of ${orders.length} orders`,
        );
    }

    // Verify capacity limits are not exceeded
    const capacityLimits = await prisma.v2CapacityLimit.findMany({
        include: { field: { select: { name: true } } },
    });
    if (capacityLimits.length > 0) {
        console.log(`\n  Capacity check (${capacityLimits.length} limits):`);
        let exceeded = 0;
        for (const cl of capacityLimits) {
            const rows = await prisma.$queryRaw`
                SELECT COALESCE(SUM(oc.count), 0)::int AS current_count
                FROM v2_option_counts oc
                WHERE oc.year_id = ${cl.yearId}
                    AND oc.field_name = ${cl.field.name}
                    AND oc.option_value = ${cl.optionValue}
            ` as { current_count: number }[];
            const current = rows[0]?.current_count ?? 0;
            if (current > cl.maxCount) {
                console.warn(
                    `    EXCEEDED: ${cl.field.name}="${cl.optionValue}" count=${current} max=${cl.maxCount}`,
                );
                exceeded++;
            }
        }
        if (exceeded === 0) {
            console.log(`    All capacity limits OK`);
        } else {
            console.warn(`    ${exceeded} capacity limit(s) exceeded`);
        }
    }
}

// ---- Main ----

async function main() {
    console.log("V2 Order Backfill");
    console.log("=================");
    if (DRY_RUN) console.log(">>> DRY RUN — no data will be written <<<");
    console.log();

    const submissions = await prisma.registrationSubmission.findMany({
        orderBy: { createdAt: "asc" },
    });
    console.log(`Found ${submissions.length} submission(s) to backfill\n`);

    if (submissions.length === 0) {
        console.log("Nothing to do.");
        return;
    }

    // Disable the capacity trigger — historical data already passed
    // capacity checks at submission time
    if (!DRY_RUN) {
        await prisma.$executeRawUnsafe(
            `ALTER TABLE v2_order_line_items DISABLE TRIGGER trg_v2_enforce_capacity`,
        );
        console.log("Capacity trigger disabled for backfill\n");
    }

    const stats: DryRunStats = {
        orders: 0,
        people: 0,
        lineItems: 0,
        bankLinked: 0,
        skipped: 0,
        priceMismatches: 0,
    };

    // Accumulate option counts during dry-run for capacity checks
    // fieldName → optionValue → count
    const dryRunOptionCounts = new Map<string, Map<string, number>>();

    let lastLog = Date.now();

    for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i];
        const maps = await getFormMaps(sub.formId);

        if (!maps) {
            console.warn(
                `  [${i + 1}/${submissions.length}] Skipping ${sub.id} — no v2 catalog for form ${sub.formId}`,
            );
            // Clean up any stale v2 orders from a previous run
            if (!DRY_RUN) {
                await prisma.v2Order.deleteMany({
                    where: { legacySubmissionId: sub.id },
                });
            }
            stats.skipped++;
            continue;
        }

        if (DRY_RUN) {
            const data = sub.data as Record<string, unknown>;
            const ap = Array.isArray(data.additionalPeople)
                ? data.additionalPeople
                : [];
            const pricingSummary = sub.pricingSummary as PricingSummaryData | null;
            stats.orders++;
            stats.people += 1 + ap.length;

            let liCount = 0;
            let liPriceSum = 0;

            const sumItems = (
                personData: Record<string, unknown>,
                fieldsToCheck: InputField[],
            ) => {
                for (const field of fieldsToCheck) {
                    if (!maps.fieldNameToV2.has(field.name)) continue;
                    const val = personData[field.name];
                    if (val === undefined || val === null) continue;
                    const items = resolveLineItems(field, val, maps, pricingSummary);
                    liCount += items.length;
                    for (const li of items) {
                        liPriceSum += li.unitPriceAtSubmission * li.quantity;
                    }
                }
            };

            sumItems(data, maps.inputFields);
            for (const person of ap) {
                sumItems(
                    person as Record<string, unknown>,
                    maps.inputFields.filter((f) => f.includeForAdditionalPeople),
                );
            }
            stats.lineItems += liCount;

            // Accumulate option counts for capacity check
            // (only non-test, non-cancelled/rejected — matching v2_option_counts view)
            const shouldCount = !sub.isTest &&
                sub.status !== "CANCELLED" && sub.status !== "REJECTED";
            if (shouldCount) {
                const countItems = (
                    personData: Record<string, unknown>,
                    fieldsToCheck: InputField[],
                ) => {
                    for (const field of fieldsToCheck) {
                        const v2Field = maps.fieldNameToV2.get(field.name);
                        if (!v2Field) continue;
                        const val = personData[field.name];
                        if (val === undefined || val === null) continue;
                        const items = resolveLineItems(field, val, maps, pricingSummary);
                        for (const li of items) {
                            if (!li.value || li.value === "" || li.value === "false") continue;
                            const optValue = li.value;
                            if (!dryRunOptionCounts.has(field.name)) {
                                dryRunOptionCounts.set(field.name, new Map());
                            }
                            const fieldMap = dryRunOptionCounts.get(field.name)!;
                            fieldMap.set(optValue, (fieldMap.get(optValue) ?? 0) + li.quantity);
                        }
                    }
                };
                countItems(data, maps.inputFields);
                for (const person of ap) {
                    countItems(
                        person as Record<string, unknown>,
                        maps.inputFields.filter((f) => f.includeForAdditionalPeople),
                    );
                }
            }

            const expectedTotal = sub.totalPrice ?? 0;
            if (expectedTotal !== liPriceSum) {
                console.warn(
                    `  MISMATCH: ${sub.id} totalPrice=${expectedTotal} lineItemSum=${liPriceSum} (diff=${liPriceSum - expectedTotal})`,
                );
                stats.priceMismatches++;
            }

            // Dry-run bank transaction count
            const bankCount = await prisma.bankTransaction.count({
                where: { submissionId: sub.id },
            });
            stats.bankLinked += bankCount;

            if ((i + 1) % 50 === 0 || i === submissions.length - 1 || Date.now() - lastLog > 30_000) {
                lastLog = Date.now();
                console.log(
                    `  [${i + 1}/${submissions.length}] ${stats.orders} orders, ${stats.people} people, ${stats.lineItems} line items`,
                );
            }
        } else {
            await prisma.$transaction(
                async (tx) => {
                    const result = await backfillSubmission(tx, sub, maps);
                    stats.orders++;
                    stats.people += result.people;
                    stats.lineItems += result.lineItems;
                    stats.bankLinked += result.bankLinked;
                    if (result.priceMismatch) stats.priceMismatches++;
                },
                { timeout: 60_000 },
            );

            if ((i + 1) % 50 === 0 || i === submissions.length - 1 || Date.now() - lastLog > 30_000) {
                lastLog = Date.now();
                console.log(
                    `  [${i + 1}/${submissions.length}] ${stats.orders} orders, ${stats.people} people, ${stats.lineItems} line items, ${stats.bankLinked} bank txns linked`,
                );
            }
        }
    }

    console.log("\n=== Summary ===");
    console.log(`  Orders: ${stats.orders}`);
    console.log(`  People: ${stats.people}`);
    console.log(`  Line items: ${stats.lineItems}`);
    console.log(`  Bank transactions linked: ${stats.bankLinked}`);
    if (stats.skipped > 0) {
        console.log(`  Skipped (no v2 catalog): ${stats.skipped}`);
    }
    if (stats.priceMismatches > 0) {
        console.warn(`  PRICE MISMATCHES: ${stats.priceMismatches}`);
    }

    if (DRY_RUN) {
        // Compare accumulated counts against v1 option counts
        const { getOptionCountsForYearFresh } = await import(
            "../../lib/services/registration"
        );
        const yearIds = new Set(submissions.map((s) => s.yearId));

        // Build field ID → label map for readable output
        const fieldIdToLabel = new Map<string, string>();
        for (const [, maps] of formMapsCache) {
            for (const f of maps.inputFields) {
                fieldIdToLabel.set(f.id, f.label);
                fieldIdToLabel.set(f.name, f.label);
            }
        }
        const label = (fieldName: string) =>
            fieldIdToLabel.get(fieldName) ?? fieldName;

        // Build capacity limit lookup: fieldName → optionValue → maxCount
        const capacityLimits = await prisma.v2CapacityLimit.findMany({
            include: { field: { select: { name: true } } },
        });
        const capLookup = new Map<string, number>();
        for (const cl of capacityLimits) {
            capLookup.set(`${cl.field.name}:${cl.optionValue}`, cl.maxCount);
        }

        // Build option legacyId → name map to consolidate v1 counts
        // (v1 counts UUIDs and names separately; resolve UUIDs to names)
        const optIdToName = new Map<string, string>();
        for (const [, maps] of formMapsCache) {
            for (const [legacyId, opt] of maps.optionLegacyToV2) {
                optIdToName.set(legacyId, opt.name);
            }
        }

        console.log(`\n  Option count reconciliation (${yearIds.size} year(s)):`);
        const mismatches: { field: string; option: string; v1: number; v2: number; diff: number; cap: string }[] = [];
        for (const yearId of yearIds) {
            const v1Raw = await getOptionCountsForYearFresh(yearId);

            // Consolidate v1 counts: resolve option IDs to names
            const v1Consolidated: Record<string, Record<string, number>> = {};
            for (const [fieldName, optionMap] of Object.entries(v1Raw)) {
                if (!v1Consolidated[fieldName]) v1Consolidated[fieldName] = {};
                for (const [optValue, count] of Object.entries(optionMap)) {
                    const resolvedName = optIdToName.get(optValue) ?? optValue;
                    v1Consolidated[fieldName][resolvedName] =
                        (v1Consolidated[fieldName][resolvedName] ?? 0) + count;
                }
            }

            for (const [fieldName, optionMap] of Object.entries(v1Consolidated)) {
                for (const [optValue, v1Count] of Object.entries(optionMap)) {
                    const v2Count = dryRunOptionCounts.get(fieldName)?.get(optValue) ?? 0;
                    if (v1Count !== v2Count) {
                        const maxCount = capLookup.get(`${fieldName}:${optValue}`);
                        const capStr = maxCount !== undefined
                            ? (v2Count > maxCount ? `${maxCount} EXCEEDED` : `${maxCount}`)
                            : "—";
                        mismatches.push({
                            field: label(fieldName),
                            option: optValue,
                            v1: v1Count,
                            v2: v2Count,
                            diff: v2Count - v1Count,
                            cap: capStr,
                        });
                    }
                }
            }
        }
        if (mismatches.length === 0) {
            console.log(`    All option counts match v1`);
        } else {
            console.warn(`    ${mismatches.length} option count mismatch(es):\n`);
            console.table(mismatches);
        }

        // Capacity check against full v2 counts
        if (capacityLimits.length > 0) {
            const exceeded: { field: string; option: string; count: number; max: number }[] = [];
            for (const cl of capacityLimits) {
                const count = dryRunOptionCounts.get(cl.field.name)?.get(cl.optionValue) ?? 0;
                if (count > cl.maxCount) {
                    exceeded.push({
                        field: label(cl.field.name),
                        option: cl.optionValue,
                        count,
                        max: cl.maxCount,
                    });
                }
            }
            if (exceeded.length === 0) {
                console.log(`\n  Capacity check: all ${capacityLimits.length} limits OK`);
            } else {
                console.warn(`\n  Capacity check: ${exceeded.length} limit(s) exceeded:\n`);
                console.table(exceeded);
            }
        }

        console.log("\nDry run complete — no changes made.\n");
        return;
    }

    // Re-enable the capacity trigger
    await prisma.$executeRawUnsafe(
        `ALTER TABLE v2_order_line_items ENABLE TRIGGER trg_v2_enforce_capacity`,
    );
    console.log("\nCapacity trigger re-enabled");

    await verify();
    console.log("\nDone!");
}

main()
    .catch((e) => {
        console.error("Backfill failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
