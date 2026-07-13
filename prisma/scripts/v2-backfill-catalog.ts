/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck — Prisma-generated v2 model delegates are not visible to tsc outside the Next.js build scope
import { PrismaClient } from "@prisma/client";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { migrateFormData } from "../../lib/utils/form-migration";
import { getAllInputFields } from "../../lib/types/registration-form";
import type {
    RegistrationFormData,
    InputField,
    FormCondition,
    PricingDefinition,
    PricedOption,
    CapacityLimit,
} from "../../lib/types/registration-form";

const prisma = new PrismaClient();

// ---- Types ----

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TxClient = any;

interface LegacyMaps {
    pricingDefinitions: Record<string, string>;
    pricingOptions: Record<string, string>;
    formFields: Record<string, string>;
    formConditions: Record<string, string>;
    capacityLimits: Record<string, string>;
}

interface MergedOption {
    option: PricedOption;
    isActive: boolean;
}

interface MergedDefinition {
    def: PricingDefinition;
    options: MergedOption[];
    isActive: boolean;
    sourceTiers: string[];
}

interface MergedField {
    field: InputField;
    isActive: boolean;
}

interface MergedData {
    priceTiers: string[];
    definitions: MergedDefinition[];
    fields: MergedField[];
    conditions: FormCondition[];
    capacityLimits: CapacityLimit[];
}

// ---- Merge helpers ----

function buildMergedData(
    dbData: RegistrationFormData,
    seedData: RegistrationFormData | null,
): MergedData {
    const dbFields = getAllInputFields(dbData.fields);
    const seedFields = seedData
        ? getAllInputFields(seedData.fields)
        : [];

    // Merge fields: DB = active, seed-only = inactive
    const mergedFields: MergedField[] = [];
    const dbFieldIds = new Set(dbFields.map((f) => f.id));
    for (const f of dbFields) {
        mergedFields.push({ field: f, isActive: true });
    }
    for (const f of seedFields) {
        if (!dbFieldIds.has(f.id)) {
            mergedFields.push({ field: f, isActive: false });
        }
    }

    // Merge pricing definitions
    const mergedDefs: MergedDefinition[] = [];
    const dbDefIds = new Set(
        dbData.pricingDefinitions.map((d) => d.id),
    );
    for (const def of dbData.pricingDefinitions) {
        const seedDef = seedData?.pricingDefinitions.find(
            (d) => d.id === def.id,
        );
        const dbOptIds = new Set(def.options.map((o) => o.id));
        const mergedOpts: MergedOption[] = def.options.map((o) => ({
            option: o,
            isActive: true,
        }));
        if (seedDef) {
            for (const o of seedDef.options) {
                if (!dbOptIds.has(o.id)) {
                    mergedOpts.push({ option: o, isActive: false });
                }
            }
        }
        mergedDefs.push({
            def,
            options: mergedOpts,
            isActive: true,
            sourceTiers: dbData.priceTiers,
        });
    }
    if (seedData) {
        for (const def of seedData.pricingDefinitions) {
            if (!dbDefIds.has(def.id)) {
                mergedDefs.push({
                    def,
                    options: def.options.map((o) => ({
                        option: o,
                        isActive: false,
                    })),
                    isActive: false,
                    sourceTiers: seedData.priceTiers,
                });
            }
        }
    }

    // Merge conditions (no is_active flag — just union by id)
    const condMap = new Map<string, FormCondition>();
    for (const c of dbData.conditions) condMap.set(c.id, c);
    if (seedData) {
        for (const c of seedData.conditions) {
            if (!condMap.has(c.id)) condMap.set(c.id, c);
        }
    }

    // Merge capacity limits (union by id, dedup by fieldId+value)
    const capMap = new Map<string, CapacityLimit>();
    for (const c of dbData.capacityLimits) capMap.set(c.id, c);
    if (seedData) {
        for (const c of seedData.capacityLimits) {
            if (!capMap.has(c.id)) capMap.set(c.id, c);
        }
    }
    const capSeen = new Set<string>();
    const dedupedCaps: CapacityLimit[] = [];
    for (const cap of capMap.values()) {
        const key = `${cap.fieldId}:${cap.value}`;
        if (!capSeen.has(key)) {
            dedupedCaps.push(cap);
            capSeen.add(key);
        }
    }

    // Merge price tiers (union, sorted by date)
    const tierSet = new Set(dbData.priceTiers);
    if (seedData) {
        for (const t of seedData.priceTiers) tierSet.add(t);
    }
    const priceTiers = Array.from(tierSet).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    return {
        priceTiers,
        definitions: mergedDefs,
        fields: mergedFields,
        conditions: Array.from(condMap.values()),
        capacityLimits: dedupedCaps,
    };
}

function remapPrices(
    prices: number[],
    sourceTiers: string[],
    mergedTiers: string[],
    usePriceTiers: boolean,
): number[] {
    if (!usePriceTiers) {
        return [prices[0] ?? 0];
    }
    const result = new Array(mergedTiers.length + 1).fill(0);
    for (let i = 0; i < sourceTiers.length; i++) {
        const mergedIdx = mergedTiers.indexOf(sourceTiers[i]);
        if (mergedIdx >= 0) {
            result[mergedIdx] = prices[i] ?? 0;
        }
    }
    result[mergedTiers.length] = prices[sourceTiers.length] ?? 0;
    return result;
}

// ---- Cleanup ----

async function cleanCatalog(
    tx: TxClient,
    formId: string,
    yearId: string,
): Promise<void> {
    await tx.v2EmailSection.deleteMany({
        where: { template: { yearId } },
    });
    await tx.v2EmailTemplate.deleteMany({ where: { yearId } });
    await tx.v2CapacityLimit.deleteMany({ where: { formId } });
    await tx.v2FormConditionRule.deleteMany({
        where: { condition: { formId } },
    });
    await tx.v2FormCondition.deleteMany({ where: { formId } });
    await tx.v2FormField.deleteMany({ where: { formId } });
    await tx.v2PricingOptionPrice.deleteMany({
        where: { option: { definition: { formId } } },
    });
    await tx.v2PricingOption.deleteMany({
        where: { definition: { formId } },
    });
    await tx.v2PricingDefinition.deleteMany({ where: { formId } });
    await tx.v2PriceTier.deleteMany({ where: { formId } });
}

// ---- Catalog backfill ----

async function backfillCatalog(
    tx: TxClient,
    formId: string,
    yearId: string,
    merged: MergedData,
): Promise<LegacyMaps> {
    const maps: LegacyMaps = {
        pricingDefinitions: {},
        pricingOptions: {},
        formFields: {},
        formConditions: {},
        capacityLimits: {},
    };

    // 1. Price tiers (dated + fallback)
    const tierIds: string[] = [];
    for (let i = 0; i < merged.priceTiers.length; i++) {
        const id = randomUUID();
        tierIds.push(id);
        await tx.v2PriceTier.create({
            data: {
                id,
                formId,
                yearId,
                deadline: new Date(merged.priceTiers[i]),
                sortOrder: i,
            },
        });
    }
    const fallbackTierId = randomUUID();
    tierIds.push(fallbackTierId);
    await tx.v2PriceTier.create({
        data: {
            id: fallbackTierId,
            formId,
            yearId,
            deadline: null,
            sortOrder: merged.priceTiers.length,
        },
    });

    // 2. Pricing definitions → options → prices
    for (let di = 0; di < merged.definitions.length; di++) {
        const { def, options, isActive, sourceTiers } =
            merged.definitions[di];
        const defId = randomUUID();
        maps.pricingDefinitions[def.id] = defId;

        await tx.v2PricingDefinition.create({
            data: {
                id: defId,
                legacyId: def.id,
                formId,
                yearId,
                name: def.name,
                type: def.type ?? "options",
                multiSelect: def.multiSelect ?? false,
                unitName: def.unitName ?? null,
                usePriceTiers: def.usePriceTiers,
                isActive,
                sortOrder: di,
            },
        });

        for (let oi = 0; oi < options.length; oi++) {
            const { option, isActive: optActive } = options[oi];
            const optId = randomUUID();
            maps.pricingOptions[option.id] = optId;

            await tx.v2PricingOption.create({
                data: {
                    id: optId,
                    legacyId: option.id,
                    definitionId: defId,
                    name: option.name,
                    description: option.description ?? "",
                    isActive: optActive,
                    sortOrder: oi,
                },
            });

            const remapped = remapPrices(
                option.prices,
                sourceTiers,
                merged.priceTiers,
                def.usePriceTiers,
            );
            for (let pi = 0; pi < remapped.length; pi++) {
                await tx.v2PricingOptionPrice.create({
                    data: {
                        id: randomUUID(),
                        optionId: optId,
                        tierId: tierIds[pi],
                        price: remapped[pi],
                    },
                });
            }
        }
    }

    // 3. Form fields
    for (let fi = 0; fi < merged.fields.length; fi++) {
        const { field, isActive } = merged.fields[fi];
        const fieldId = randomUUID();
        maps.formFields[field.id] = fieldId;

        const pricingDefId = field.pricingId
            ? (maps.pricingDefinitions[field.pricingId] ?? null)
            : null;

        if (field.pricingId && !pricingDefId) {
            console.warn(
                `  Warning: field "${field.name}" references unknown pricing def "${field.pricingId}"`,
            );
        }

        await tx.v2FormField.create({
            data: {
                id: fieldId,
                legacyId: field.id,
                formId,
                yearId,
                name: field.name,
                label: field.label,
                type: field.type,
                required: field.required,
                editable: field.editable ?? false,
                pricingDefinitionId: pricingDefId,
                includeForAdditionalPeople:
                    field.includeForAdditionalPeople ?? false,
                options: field.options ?? [],
                isActive,
                sortOrder: fi,
            },
        });
    }

    // 4. Form conditions + rules
    for (let ci = 0; ci < merged.conditions.length; ci++) {
        const cond = merged.conditions[ci];
        const condId = randomUUID();
        maps.formConditions[cond.id] = condId;

        await tx.v2FormCondition.create({
            data: {
                id: condId,
                legacyId: cond.id,
                formId,
                yearId,
                name: cond.name,
                sortOrder: ci,
            },
        });

        for (let ri = 0; ri < cond.rules.length; ri++) {
            const rule = cond.rules[ri];
            const fieldId = rule.fieldId
                ? (maps.formFields[rule.fieldId] ?? null)
                : null;

            if (rule.fieldId && !fieldId) {
                console.warn(
                    `  Warning: condition "${cond.name}" rule references unknown field "${rule.fieldId}"`,
                );
            }

            await tx.v2FormConditionRule.create({
                data: {
                    id: randomUUID(),
                    conditionId: condId,
                    fieldId,
                    operator: rule.operator ?? "equals",
                    value: rule.value ?? null,
                    connector: rule.connector ?? "AND",
                    sortOrder: ri,
                },
            });
        }
    }

    // 5. Capacity limits
    for (const limit of merged.capacityLimits) {
        const fieldId = maps.formFields[limit.fieldId];
        if (!fieldId) {
            console.warn(
                `  Warning: capacity limit references unknown field "${limit.fieldId}"`,
            );
            continue;
        }

        const limitId = randomUUID();
        maps.capacityLimits[limit.id] = limitId;

        await tx.v2CapacityLimit.create({
            data: {
                id: limitId,
                legacyId: limit.id,
                formId,
                yearId,
                fieldId,
                optionValue: limit.value,
                maxCount: limit.maxCount,
            },
        });
    }

    return maps;
}

// ---- Email helpers ----

async function createInlineCondition(
    tx: TxClient,
    formId: string,
    yearId: string,
    condition: FormCondition,
    fieldMap: Record<string, string>,
): Promise<string> {
    const condId = randomUUID();

    await tx.v2FormCondition.create({
        data: {
            id: condId,
            legacyId: condition.id,
            formId,
            yearId,
            name: condition.name || "",
            sortOrder: 0,
        },
    });

    for (let ri = 0; ri < condition.rules.length; ri++) {
        const rule = condition.rules[ri];
        const fieldId = rule.fieldId
            ? (fieldMap[rule.fieldId] ?? null)
            : null;

        if (rule.fieldId && !fieldId) {
            console.warn(
                `    Warning: email condition rule references unknown field "${rule.fieldId}"`,
            );
        }

        await tx.v2FormConditionRule.create({
            data: {
                id: randomUUID(),
                conditionId: condId,
                fieldId,
                operator: rule.operator ?? "equals",
                value: rule.value ?? null,
                connector: rule.connector ?? "AND",
                sortOrder: ri,
            },
        });
    }

    return condId;
}

interface RawEmailSection {
    id: string;
    body: string;
    condition: FormCondition;
    sortOrder: number;
    attachments: unknown[];
}

async function backfillEmailSections(
    tx: TxClient,
    templateId: string,
    formId: string,
    yearId: string,
    sections: unknown[],
    fieldMap: Record<string, string>,
): Promise<void> {
    for (const raw of sections) {
        const section = raw as RawEmailSection;

        let conditionId: string | null = null;
        if (section.condition?.rules?.length > 0) {
            conditionId = await createInlineCondition(
                tx,
                formId,
                yearId,
                section.condition,
                fieldMap,
            );
        }

        await tx.v2EmailSection.create({
            data: {
                id: randomUUID(),
                templateId,
                conditionId,
                body: section.body ?? "",
                attachments: section.attachments ?? [],
                sortOrder: section.sortOrder ?? 0,
            },
        });
    }
}

// ---- Email backfill ----

interface YearEmailData {
    id: string;
    confirmationEmailEnabled: boolean;
    confirmationEmailSubject: string | null;
    confirmationEmailBody: string | null;
    confirmationEmailBcc: string | null;
    confirmationEmailAccountId: string | null;
    confirmationEmailSections: unknown;
    confirmationEmailAttachments: unknown;
    priceChangeEmailEnabled: boolean;
    priceChangeEmailSubject: string | null;
    priceChangeEmailBody: string | null;
    priceChangeEmailBcc: string | null;
    priceChangeEmailAccountId: string | null;
    priceChangeEmailSections: unknown;
    priceChangeEmailAttachments: unknown;
    paymentEmailEnabled: boolean;
    paymentEmailSubject: string | null;
    paymentEmailBody: string | null;
    paymentEmailBcc: string | null;
    paymentEmailAccountId: string | null;
    paymentEmailSections: unknown;
    paymentEmailAttachments: unknown;
    conditionalEmails: Array<{
        id: string;
        name: string;
        enabled: boolean;
        conditionFieldId: string;
        conditionOperator: string;
        conditionValue: string | null;
        subject: string | null;
        body: string | null;
        bcc: string | null;
        accountId: string | null;
        sections: unknown;
        attachments: unknown;
        sortOrder: number;
    }>;
}

async function backfillEmails(
    tx: TxClient,
    year: YearEmailData,
    formId: string,
    fieldMap: Record<string, string>,
): Promise<void> {
    const yearId = year.id;

    const emailTypes = [
        {
            type: "confirmation",
            enabled: year.confirmationEmailEnabled,
            subject: year.confirmationEmailSubject,
            body: year.confirmationEmailBody,
            bcc: year.confirmationEmailBcc,
            accountId: year.confirmationEmailAccountId,
            sections: year.confirmationEmailSections,
            attachments: year.confirmationEmailAttachments,
        },
        {
            type: "payment",
            enabled: year.paymentEmailEnabled,
            subject: year.paymentEmailSubject,
            body: year.paymentEmailBody,
            bcc: year.paymentEmailBcc,
            accountId: year.paymentEmailAccountId,
            sections: year.paymentEmailSections,
            attachments: year.paymentEmailAttachments,
        },
        {
            type: "price_change",
            enabled: year.priceChangeEmailEnabled,
            subject: year.priceChangeEmailSubject,
            body: year.priceChangeEmailBody,
            bcc: year.priceChangeEmailBcc,
            accountId: year.priceChangeEmailAccountId,
            sections: year.priceChangeEmailSections,
            attachments: year.priceChangeEmailAttachments,
        },
    ];

    for (let i = 0; i < emailTypes.length; i++) {
        const et = emailTypes[i];
        const templateId = randomUUID();

        await tx.v2EmailTemplate.create({
            data: {
                id: templateId,
                yearId,
                type: et.type,
                name: "",
                enabled: et.enabled,
                subject: et.subject,
                body: et.body,
                bcc: et.bcc,
                accountId: et.accountId,
                attachments: (et.attachments as unknown[]) ?? [],
                sortOrder: i,
            },
        });

        const sectionArr = Array.isArray(et.sections)
            ? et.sections
            : [];
        if (sectionArr.length > 0) {
            await backfillEmailSections(
                tx,
                templateId,
                formId,
                yearId,
                sectionArr,
                fieldMap,
            );
        }
    }

    // Conditional emails
    for (const ce of year.conditionalEmails) {
        const fieldId = fieldMap[ce.conditionFieldId] ?? null;
        if (!fieldId) {
            console.warn(
                `  Warning: conditional email "${ce.name}" references unknown field "${ce.conditionFieldId}"`,
            );
        }

        const condId = randomUUID();
        await tx.v2FormCondition.create({
            data: {
                id: condId,
                formId,
                yearId,
                name: `conditional-email:${ce.name}`,
                sortOrder: 0,
            },
        });

        await tx.v2FormConditionRule.create({
            data: {
                id: randomUUID(),
                conditionId: condId,
                fieldId,
                operator: ce.conditionOperator,
                value: ce.conditionValue,
                connector: "AND",
                sortOrder: 0,
            },
        });

        const templateId = randomUUID();
        await tx.v2EmailTemplate.create({
            data: {
                id: templateId,
                yearId,
                type: "conditional",
                conditionId: condId,
                name: ce.name,
                enabled: ce.enabled,
                subject: ce.subject,
                body: ce.body,
                bcc: ce.bcc,
                accountId: ce.accountId,
                attachments: (ce.attachments as unknown[]) ?? [],
                sortOrder: ce.sortOrder,
            },
        });

        const sectionArr = Array.isArray(ce.sections)
            ? (ce.sections as unknown[])
            : [];
        if (sectionArr.length > 0) {
            await backfillEmailSections(
                tx,
                templateId,
                formId,
                yearId,
                sectionArr,
                fieldMap,
            );
        }
    }
}

// ---- Verification ----

async function verify(): Promise<void> {
    const counts = {
        priceTiers: await prisma.v2PriceTier.count(),
        pricingDefinitions: await prisma.v2PricingDefinition.count(),
        pricingOptions: await prisma.v2PricingOption.count(),
        pricingOptionPrices: await prisma.v2PricingOptionPrice.count(),
        formFields: await prisma.v2FormField.count(),
        formConditions: await prisma.v2FormCondition.count(),
        formConditionRules: await prisma.v2FormConditionRule.count(),
        capacityLimits: await prisma.v2CapacityLimit.count(),
        emailTemplates: await prisma.v2EmailTemplate.count(),
        emailSections: await prisma.v2EmailSection.count(),
    };

    console.log("\n=== Verification ===");
    for (const [table, count] of Object.entries(counts)) {
        console.log(`  ${table}: ${count}`);
    }

    const pricingFieldsNoLink = await prisma.v2FormField.count({
        where: {
            type: {
                in: [
                    "pricing_select",
                    "pricing_quantity",
                    "pricing_multi_select",
                ],
            },
            pricingDefinitionId: null,
        },
    });
    if (pricingFieldsNoLink > 0) {
        console.warn(
            `  WARNING: ${pricingFieldsNoLink} pricing field(s) missing pricing definition link`,
        );
    }

    const inactive = {
        fields: await prisma.v2FormField.count({
            where: { isActive: false },
        }),
        definitions: await prisma.v2PricingDefinition.count({
            where: { isActive: false },
        }),
        options: await prisma.v2PricingOption.count({
            where: { isActive: false },
        }),
    };

    if (inactive.fields || inactive.definitions || inactive.options) {
        console.log(
            "\n  Recovered from seed (is_active=false):",
        );
        if (inactive.fields)
            console.log(`    fields: ${inactive.fields}`);
        if (inactive.definitions)
            console.log(`    definitions: ${inactive.definitions}`);
        if (inactive.options)
            console.log(`    options: ${inactive.options}`);
    }
}

// ---- Main ----

async function main() {
    console.log("V2 Catalog Backfill");
    console.log("===================\n");

    // 1. Load sources
    const seedPath = join(
        process.cwd(),
        "prisma",
        "seed-data.json",
    );
    const seedRaw = JSON.parse(readFileSync(seedPath, "utf-8"));
    const seedYearId: string = seedRaw.year.id;
    const seedFormData = migrateFormData(seedRaw.registrationForm);
    console.log(
        `Seed data loaded (year: ${seedRaw.year.title}, id: ${seedYearId})`,
    );

    const forms = await prisma.registrationForm.findMany();
    console.log(`Found ${forms.length} registration form(s) in DB`);

    const years = await prisma.year.findMany({
        include: {
            conditionalEmails: { orderBy: { sortOrder: "asc" } },
            registrationForm: true,
        },
    });

    const allMaps: Record<string, LegacyMaps> = {};

    // 2. Per-form backfill (catalog + emails in one transaction)
    for (const form of forms) {
        const dbData = migrateFormData(form.fields);
        const hasSeed = form.yearId === seedYearId;
        const merged = buildMergedData(
            dbData,
            hasSeed ? seedFormData : null,
        );

        const year = years.find(
            (y) => y.registrationForm?.id === form.id,
        );

        console.log(
            `\nForm ${form.id} (year: ${form.yearId})${hasSeed ? " [merged with seed]" : ""}`,
        );
        console.log(
            `  Fields: ${merged.fields.length} (${merged.fields.filter((f) => !f.isActive).length} inactive)`,
        );
        console.log(
            `  Pricing definitions: ${merged.definitions.length}`,
        );
        console.log(`  Conditions: ${merged.conditions.length}`);
        console.log(
            `  Capacity limits: ${merged.capacityLimits.length}`,
        );
        console.log(
            `  Price tiers: ${merged.priceTiers.length} + 1 fallback`,
        );

        const maps = await prisma.$transaction(
            async (tx) => {
                await cleanCatalog(tx, form.id, form.yearId);
                const m = await backfillCatalog(
                    tx,
                    form.id,
                    form.yearId,
                    merged,
                );

                if (year) {
                    const ceCount = year.conditionalEmails.length;
                    console.log(
                        `  Email templates: 3 year-level + ${ceCount} conditional`,
                    );
                    await backfillEmails(
                        tx,
                        year as unknown as YearEmailData,
                        form.id,
                        m.formFields,
                    );
                }

                return m;
            },
            { timeout: 60_000 },
        );

        allMaps[form.id] = maps;
    }

    // 3. Persist legacy maps
    const mapsPath = join(
        process.cwd(),
        "prisma",
        "scripts",
        "v2-legacy-maps.json",
    );
    writeFileSync(mapsPath, JSON.stringify(allMaps, null, 4));
    console.log(`\nLegacy maps written to ${mapsPath}`);

    // 4. Verify
    await verify();

    console.log("\nDone!");
}

main()
    .catch((e) => {
        console.error("Backfill failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
