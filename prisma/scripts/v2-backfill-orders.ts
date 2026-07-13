/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — Prisma-generated v2 model delegates are not visible to tsc outside the Next.js build scope
import { PrismaClient } from "@prisma/client";
import { migrateFormData } from "../../lib/utils/form-migration";
import { getAllInputFields } from "../../lib/types/registration-form";
import type {
    InputField,
    PricingSummaryData,
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
    optionLegacyToV2: Map<string, { id: string; name: string }>;
    optionNameToV2: Map<string, { id: string; name: string }>;
    tiers: { id: string; sortOrder: number; deadline: Date | null }[];
    tierPrices: Map<string, Map<string, number>>; // tierId → optionId → price
    inputFields: InputField[];
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
    const inputFields = getAllInputFields(formData.fields);

    const v2Fields = await prisma.v2FormField.findMany({
        where: { formId, isActive: true },
    });
    const fieldNameToV2 = new Map(
        v2Fields.map((f) => [f.name, { id: f.id, type: f.type }]),
    );

    const v2Options = await prisma.v2PricingOption.findMany({
        where: { definition: { formId }, isActive: true },
    });
    const optionLegacyToV2 = new Map(
        v2Options
            .filter((o) => o.legacyId)
            .map((o) => [o.legacyId!, { id: o.id, name: o.name }]),
    );
    const optionNameToV2 = new Map(
        v2Options.map((o) => [o.name, { id: o.id, name: o.name }]),
    );

    const tiers = await prisma.v2PriceTier.findMany({
        where: { formId },
        orderBy: { sortOrder: "asc" },
    });

    // Pre-load all prices for all tiers
    const tierPrices = new Map<string, Map<string, number>>();
    for (const tier of tiers) {
        const prices = await prisma.v2PricingOptionPrice.findMany({
            where: { tierId: tier.id },
        });
        tierPrices.set(
            tier.id,
            new Map(prices.map((p) => [p.optionId, p.price])),
        );
    }

    const maps: FormMaps = {
        fieldNameToV2,
        optionLegacyToV2,
        optionNameToV2,
        tiers,
        tierPrices,
        inputFields,
    };
    formMapsCache.set(formId, maps);
    return maps;
}

// ---- Tier resolution ----

function getActiveTierId(
    maps: FormMaps,
    pricingSummary: PricingSummaryData | null,
): string | null {
    if (maps.tiers.length === 0) return null;

    if (pricingSummary && pricingSummary.applicableTierIndex != null) {
        const tier = maps.tiers[pricingSummary.applicableTierIndex];
        if (tier) return tier.id;
    }

    // Fallback tier (deadline = null)
    const fallback = maps.tiers.find((t) => !t.deadline);
    return fallback?.id ?? maps.tiers[maps.tiers.length - 1].id;
}

function getOptionPrice(
    maps: FormMaps,
    tierId: string | null,
    optionId: string,
): number {
    if (!tierId) return 0;
    return maps.tierPrices.get(tierId)?.get(optionId) ?? 0;
}

// ---- Line item resolution ----

interface LineItemData {
    pricingOptionId: string | null;
    value: string | null;
    quantity: number;
    unitPriceAtSubmission: number;
}

function resolveLineItems(
    field: InputField,
    rawValue: unknown,
    maps: FormMaps,
    tierId: string | null,
): LineItemData[] {
    if (field.type === "pricing_select") {
        const optionId = String(rawValue);
        const v2Opt =
            maps.optionLegacyToV2.get(optionId) ??
            maps.optionNameToV2.get(optionId);
        if (v2Opt) {
            return [{
                pricingOptionId: v2Opt.id,
                value: v2Opt.name,
                quantity: 1,
                unitPriceAtSubmission: getOptionPrice(maps, tierId, v2Opt.id),
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
            const v2Opt =
                maps.optionLegacyToV2.get(optId) ??
                maps.optionNameToV2.get(optId);
            if (v2Opt) {
                items.push({
                    pricingOptionId: v2Opt.id,
                    value: v2Opt.name,
                    quantity: 1,
                    unitPriceAtSubmission: getOptionPrice(maps, tierId, v2Opt.id),
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
            const v2Opt =
                maps.optionLegacyToV2.get(optId) ??
                maps.optionNameToV2.get(optId);
            if (v2Opt) {
                items.push({
                    pricingOptionId: v2Opt.id,
                    value: v2Opt.name,
                    quantity: qty,
                    unitPriceAtSubmission: getOptionPrice(maps, tierId, v2Opt.id),
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
): Promise<{ people: number; lineItems: number; bankLinked: number }> {
    const data = sub.data as Record<string, unknown>;
    const pricingSummary = sub.pricingSummary as PricingSummaryData | null;

    // Idempotent: delete existing v2 data for this submission
    await tx.v2Order.deleteMany({ where: { legacySubmissionId: sub.id } });

    // 1. Create v2_orders
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
            updatedAt: sub.updatedAt,
        },
    });

    // Resolve which tier was active for this submission's price
    const tierId = getActiveTierId(maps, pricingSummary);

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

    for (const field of maps.inputFields) {
        const v2Field = maps.fieldNameToV2.get(field.name);
        if (!v2Field) continue;

        const rawValue = data[field.name];
        if (rawValue === undefined || rawValue === null) continue;

        const items = resolveLineItems(field, rawValue, maps, tierId);
        for (const li of items) {
            await tx.v2OrderLineItem.create({
                data: {
                    personId: mainPerson.id,
                    orderId: order.id,
                    yearId: sub.yearId,
                    fieldId: v2Field.id,
                    ...li,
                },
            });
            totalLineItems++;
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

                const items = resolveLineItems(field, rawValue, maps, tierId);
                for (const li of items) {
                    await tx.v2OrderLineItem.create({
                        data: {
                            personId: childPerson.id,
                            orderId: order.id,
                            yearId: sub.yearId,
                            fieldId: v2Field.id,
                            ...li,
                        },
                    });
                    totalLineItems++;
                }
            }
        }
    }

    // 4. Link bank transactions
    const bankResult = await tx.bankTransaction.updateMany({
        where: { submissionId: sub.id },
        data: { orderId: order.id },
    });

    return {
        people: totalPeople,
        lineItems: totalLineItems,
        bankLinked: bankResult.count,
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

    // Spot-check: compare totalPrice on orders vs sum of line item prices
    const sampleOrders = await prisma.v2Order.findMany({
        where: { totalPrice: { not: null, gt: 0 } },
        take: 5,
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
    for (const order of sampleOrders) {
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
    if (mismatches === 0 && sampleOrders.length > 0) {
        console.log(
            `  Price spot-check: ${sampleOrders.length} orders OK`,
        );
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

    const stats: DryRunStats = {
        orders: 0,
        people: 0,
        lineItems: 0,
        bankLinked: 0,
        skipped: 0,
    };

    for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i];
        const maps = await getFormMaps(sub.formId);

        if (!maps) {
            console.warn(
                `  [${i + 1}/${submissions.length}] Skipping ${sub.id} — no v2 catalog for form ${sub.formId}`,
            );
            stats.skipped++;
            continue;
        }

        if (DRY_RUN) {
            // Count what would be created
            const data = sub.data as Record<string, unknown>;
            const ap = Array.isArray(data.additionalPeople)
                ? data.additionalPeople
                : [];
            stats.orders++;
            stats.people += 1 + ap.length;

            let liCount = 0;
            const pricingSummary = sub.pricingSummary as PricingSummaryData | null;
            const tierId = getActiveTierId(maps, pricingSummary);
            for (const field of maps.inputFields) {
                if (!maps.fieldNameToV2.has(field.name)) continue;
                const val = data[field.name];
                if (val === undefined || val === null) continue;
                liCount += resolveLineItems(field, val, maps, tierId).length;
            }
            for (const person of ap) {
                const pd = person as Record<string, unknown>;
                for (const field of maps.inputFields) {
                    if (!field.includeForAdditionalPeople) continue;
                    if (!maps.fieldNameToV2.has(field.name)) continue;
                    const val = pd[field.name];
                    if (val === undefined || val === null) continue;
                    liCount += resolveLineItems(field, val, maps, tierId).length;
                }
            }
            stats.lineItems += liCount;

            if ((i + 1) % 50 === 0 || i === submissions.length - 1) {
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
                },
                { timeout: 30_000 },
            );

            if ((i + 1) % 50 === 0 || i === submissions.length - 1) {
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

    if (DRY_RUN) {
        console.log("\nDry run complete — no changes made.\n");
        return;
    }

    await verify();
    console.log("\nDone!");
}

main()
    .catch((e) => {
        console.error("Backfill failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
