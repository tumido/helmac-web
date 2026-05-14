import { cache } from "react";
import { db } from "@/lib/db";
import type { OptionCounts, OptionPeople } from "@/lib/types/registration-form";
import { getAllInputFields } from "@/lib/types/registration-form";
import { migrateFormData } from "@/lib/utils/form-migration";
import type { StatFilter } from "@/lib/types/content-blocks";
import type { RegistrationStatus } from "@prisma/client";

// fieldName -> map of opt.id (and opt.name) -> opt.name, used to translate stored
// quantity-field JSON keys back to option names so OptionCounts stays name-keyed.
type QuantityFieldMap = Record<string, Record<string, string>>;

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
            _count: {
                select: {
                    registrationSubmissions: {
                        where: { isTest: false },
                    },
                },
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

    return {
        isOpen: activeYear.registrationOpen,
        year: activeYear,
        registrationCount: activeYear._count.registrationSubmissions,
        registrationStartDate: activeYear.registrationStartDate,
        hasForm: !!activeYear.registrationForm,
        formFields: activeYear.registrationForm?.fields ?? null,
    };
});

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
}

const PRICING_FIELD_TYPES = new Set([
    "pricing_select",
    "pricing_multi_select",
    "pricing_quantity",
]);

export const getRegistrationStatsForYear = cache(
    async (yearId: string): Promise<RegistrationStats> => {
        const [
            submissions,
            paidAgg,
            unpaidAgg,
            confirmedCount,
            pendingCount,
            waitlistCount,
            form,
        ] = await Promise.all([
            db.registrationSubmission.findMany({
                where: {
                    yearId,
                    isTest: false,
                    status: { notIn: ["CANCELLED", "REJECTED"] },
                },
                select: { data: true },
            }),
            db.registrationSubmission.aggregate({
                where: {
                    yearId,
                    isTest: false,
                    isPaid: true,
                    status: { notIn: ["CANCELLED", "REJECTED"] },
                },
                _sum: { totalPrice: true },
            }),
            db.registrationSubmission.aggregate({
                where: {
                    yearId,
                    isTest: false,
                    isPaid: false,
                    status: { notIn: ["CANCELLED", "REJECTED"] },
                },
                _sum: { totalPrice: true },
            }),
            db.registrationSubmission.count({
                where: { yearId, isTest: false, status: "CONFIRMED" },
            }),
            db.registrationSubmission.count({
                where: { yearId, isTest: false, status: "PENDING" },
            }),
            db.registrationSubmission.count({
                where: { yearId, isTest: false, status: "WAITLIST" },
            }),
            db.registrationForm.findUnique({
                where: { yearId },
                select: { fields: true },
            }),
        ]);

        const people = submissions.reduce((sum, sub) => {
            const data = sub.data as Record<string, unknown>;
            const ap = Array.isArray(data.additionalPeople)
                ? data.additionalPeople.length
                : 0;
            return sum + 1 + ap;
        }, 0);

        const fields: Record<string, FieldStatsData> = {};
        if (form) {
            const formData = migrateFormData(form.fields);
            const inputFields = getAllInputFields(formData.fields);
            const fieldTypeMap = new Map(
                inputFields.map((f) => [f.name, f.type])
            );

            for (const field of inputFields) {
                const counts: Record<string, number> = {};
                const allValues: string[] = [];
                let numericSum = 0;
                let numericCount = 0;

                const collectField = (
                    data: Record<string, unknown>
                ) => {
                    const val = data[field.name];
                    if (
                        val === undefined ||
                        val === null ||
                        val === ""
                    )
                        return;
                    const str = String(val);
                    if (str === "false") return;

                    if (str.startsWith("[")) {
                        try {
                            const arr = JSON.parse(str);
                            if (Array.isArray(arr)) {
                                for (const item of arr) {
                                    const s = String(item);
                                    if (!s) continue;
                                    counts[s] =
                                        (counts[s] || 0) + 1;
                                    allValues.push(s);
                                }
                                return;
                            }
                        } catch {
                            /* not JSON */
                        }
                    }

                    if (str.startsWith("{")) {
                        try {
                            const obj = JSON.parse(str);
                            if (
                                obj &&
                                typeof obj === "object" &&
                                !Array.isArray(obj)
                            ) {
                                for (const [k, qty] of Object.entries(
                                    obj
                                )) {
                                    const n = Number(qty) || 0;
                                    if (n > 0) {
                                        counts[k] =
                                            (counts[k] || 0) + n;
                                        numericSum += n;
                                        numericCount++;
                                    }
                                }
                                return;
                            }
                        } catch {
                            /* not JSON */
                        }
                    }

                    counts[str] = (counts[str] || 0) + 1;
                    allValues.push(str);
                    const num = Number(str);
                    if (!isNaN(num)) {
                        numericSum += num;
                        numericCount++;
                    }
                };

                for (const sub of submissions) {
                    const data = sub.data as Record<
                        string,
                        unknown
                    >;
                    collectField(data);
                    const ap = data.additionalPeople;
                    if (Array.isArray(ap)) {
                        for (const person of ap) {
                            if (
                                person &&
                                typeof person === "object"
                            ) {
                                collectField(
                                    person as Record<
                                        string,
                                        unknown
                                    >
                                );
                            }
                        }
                    }
                }

                const total = allValues.length;
                fields[field.name] = {
                    total,
                    counts,
                    sum: numericSum,
                    average:
                        numericCount > 0
                            ? Math.round(
                                  numericSum / numericCount
                              )
                            : 0,
                    values: allValues,
                    isCurrency: PRICING_FIELD_TYPES.has(
                        fieldTypeMap.get(field.name) ?? ""
                    ),
                };
            }
        }

        const fieldLabels: Record<string, string> = {};
        const fieldOptions: Record<string, string[]> = {};
        const capacityLimits: Record<string, Record<string, number>> = {};
        if (form) {
            const fd = migrateFormData(form.fields);
            const { getFieldOptionValues } = await import(
                "@/lib/utils/pricing"
            );
            const allFields = getAllInputFields(fd.fields);
            const idToName = new Map(allFields.map((f) => [f.id, f.name]));
            for (const f of allFields) {
                fieldLabels[f.name] = f.label;
                const opts =
                    f.type === "checkbox"
                        ? ["Ano", "Ne"]
                        : getFieldOptionValues(f, fd.pricingDefinitions);
                if (opts.length > 0) fieldOptions[f.name] = opts;
            }
            for (const cl of fd.capacityLimits) {
                const fieldName = idToName.get(cl.fieldId);
                if (!fieldName) continue;
                if (!capacityLimits[fieldName]) capacityLimits[fieldName] = {};
                capacityLimits[fieldName][cl.value] = cl.maxCount;
            }
        }

        return {
            registrations: submissions.length,
            people,
            paid_total: paidAgg._sum.totalPrice ?? 0,
            unpaid_total: unpaidAgg._sum.totalPrice ?? 0,
            confirmed: confirmedCount,
            pending: pendingCount,
            waitlist: waitlistCount,
            fields,
            fieldLabels,
            fieldOptions,
            capacityLimits,
        };
    }
);

function matchesFilter(
    data: Record<string, unknown>,
    filter: StatFilter
): boolean {
    if (filter.fieldFilters) {
        for (const ff of filter.fieldFilters) {
            const val = String(data[ff.fieldName] ?? "");
            if (val.startsWith("[")) {
                try {
                    const arr = JSON.parse(val);
                    if (
                        Array.isArray(arr) &&
                        !arr.includes(ff.value)
                    )
                        return false;
                    continue;
                } catch {
                    /* not JSON */
                }
            }
            if (val !== ff.value) return false;
        }
    }
    return true;
}

export async function getFilteredRegistrationStats(
    yearId: string,
    filter?: StatFilter
): Promise<RegistrationStats> {
    if (!filter) {
        return getRegistrationStatsForYear(yearId);
    }

    const statusExclude: RegistrationStatus[] = [
        "CANCELLED",
        "REJECTED",
    ];
    const statusWhere = filter.statuses?.length
        ? { in: filter.statuses as RegistrationStatus[] }
        : { notIn: statusExclude };
    const paidWhere =
        filter.isPaid !== undefined
            ? { isPaid: filter.isPaid }
            : {};

    const baseWhere = {
        yearId,
        isTest: false,
        status: statusWhere,
        ...paidWhere,
    };

    const [submissions, form] = await Promise.all([
        db.registrationSubmission.findMany({
            where: baseWhere,
            select: {
                data: true,
                status: true,
                isPaid: true,
                totalPrice: true,
            },
        }),
        db.registrationForm.findUnique({
            where: { yearId },
            select: { fields: true },
        }),
    ]);

    const hasFieldFilter =
        filter.fieldFilters && filter.fieldFilters.length > 0;

    const filtered = hasFieldFilter
        ? submissions.filter((s) =>
              matchesFilter(
                  s.data as Record<string, unknown>,
                  filter
              )
          )
        : submissions;

    let people = 0;
    let confirmed = 0;
    let pending = 0;
    let waitlist = 0;

    for (const sub of filtered) {
        const data = sub.data as Record<string, unknown>;
        const ap = Array.isArray(data.additionalPeople)
            ? data.additionalPeople.length
            : 0;
        people += 1 + ap;
        if (sub.status === "CONFIRMED") confirmed++;
        if (sub.status === "PENDING") pending++;
        if (sub.status === "WAITLIST") waitlist++;
    }

    const fields: Record<string, FieldStatsData> = {};
    if (form) {
        const formData = migrateFormData(form.fields);
        const inputFields = getAllInputFields(
            formData.fields
        );
        const fieldTypeMap = new Map(
            inputFields.map((f) => [f.name, f.type])
        );

        for (const field of inputFields) {
            const counts: Record<string, number> = {};
            const allValues: string[] = [];
            let numericSum = 0;
            let numericCount = 0;

            const collectField = (
                data: Record<string, unknown>
            ) => {
                const val = data[field.name];
                if (
                    val === undefined ||
                    val === null ||
                    val === ""
                )
                    return;
                const str = String(val);
                if (str === "false") return;

                if (str.startsWith("[")) {
                    try {
                        const arr = JSON.parse(str);
                        if (Array.isArray(arr)) {
                            for (const item of arr) {
                                const s = String(item);
                                if (!s) continue;
                                counts[s] =
                                    (counts[s] || 0) + 1;
                                allValues.push(s);
                            }
                            return;
                        }
                    } catch {
                        /* not JSON */
                    }
                }

                if (str.startsWith("{")) {
                    try {
                        const obj = JSON.parse(str);
                        if (
                            obj &&
                            typeof obj === "object" &&
                            !Array.isArray(obj)
                        ) {
                            for (const [
                                k,
                                qty,
                            ] of Object.entries(obj)) {
                                const n =
                                    Number(qty) || 0;
                                if (n > 0) {
                                    counts[k] =
                                        (counts[k] ||
                                            0) + n;
                                    numericSum += n;
                                    numericCount++;
                                }
                            }
                            return;
                        }
                    } catch {
                        /* not JSON */
                    }
                }

                counts[str] = (counts[str] || 0) + 1;
                allValues.push(str);
                const num = Number(str);
                if (!isNaN(num)) {
                    numericSum += num;
                    numericCount++;
                }
            };

            for (const sub of filtered) {
                const data = sub.data as Record<
                    string,
                    unknown
                >;
                collectField(data);
                const ap = data.additionalPeople;
                if (Array.isArray(ap)) {
                    for (const person of ap) {
                        if (
                            person &&
                            typeof person === "object"
                        ) {
                            collectField(
                                person as Record<
                                    string,
                                    unknown
                                >
                            );
                        }
                    }
                }
            }

            fields[field.name] = {
                total: allValues.length,
                counts,
                sum: numericSum,
                average:
                    numericCount > 0
                        ? Math.round(
                              numericSum / numericCount
                          )
                        : 0,
                values: allValues,
                isCurrency: PRICING_FIELD_TYPES.has(
                    fieldTypeMap.get(field.name) ?? ""
                ),
            };
        }
    }

    let paidTotal = 0;
    let unpaidTotal = 0;
    for (const sub of filtered) {
        if (sub.isPaid) {
            paidTotal += sub.totalPrice ?? 0;
        } else {
            unpaidTotal += sub.totalPrice ?? 0;
        }
    }

    const fieldLabels: Record<string, string> = {};
    const fieldOptions: Record<string, string[]> = {};
    const capacityLimits: Record<string, Record<string, number>> = {};
    if (form) {
        const fd = migrateFormData(form.fields);
        const { getFieldOptionValues } = await import(
            "@/lib/utils/pricing"
        );
        const allFields = getAllInputFields(fd.fields);
        const idToName = new Map(allFields.map((f) => [f.id, f.name]));
        for (const f of allFields) {
            fieldLabels[f.name] = f.label;
            const opts =
                f.type === "checkbox"
                    ? ["Ano", "Ne"]
                    : getFieldOptionValues(f, fd.pricingDefinitions);
            if (opts.length > 0) fieldOptions[f.name] = opts;
        }
        for (const cl of fd.capacityLimits) {
            const fieldName = idToName.get(cl.fieldId);
            if (!fieldName) continue;
            if (!capacityLimits[fieldName]) capacityLimits[fieldName] = {};
            capacityLimits[fieldName][cl.value] = cl.maxCount;
        }
    }

    return {
        registrations: filtered.length,
        people,
        paid_total: paidTotal,
        unpaid_total: unpaidTotal,
        confirmed,
        pending,
        waitlist,
        fields,
        fieldLabels,
        fieldOptions,
        capacityLimits,
    };
}

export const getRegistrationFormForYear = cache(async (yearId: string) => {
    return db.registrationForm.findUnique({
        where: { yearId },
        select: {
            id: true,
            fields: true,
            createdAt: true,
            updatedAt: true,
        },
    });
});

export const getSubmissionsForYear = cache(async (yearId: string) => {
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
});

export const getSubmissionById = cache(async (id: string) => {
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
});

export const getSubmissionCountForYear = cache(async (yearId: string) => {
    return db.registrationSubmission.count({
        where: { yearId, isTest: false },
    });
});

// Cached version for page load
export const getOptionCountsForYear = cache(async (yearId: string): Promise<OptionCounts> => {
    return computeOptionCounts(yearId);
});

// Fresh version for submission validation (no cache)
export async function getOptionCountsForYearFresh(yearId: string): Promise<OptionCounts> {
    return computeOptionCounts(yearId);
}

function countValues(
    counts: OptionCounts,
    data: Record<string, unknown>,
    quantityFields: QuantityFieldMap,
): void {
    for (const [name, val] of Object.entries(data)) {
        if (name === "additionalPeople") continue;
        const str = String(val ?? "");
        if (!str || str === "false") continue;
        if (!counts[name]) counts[name] = {};

        // Handle JSON array values (pricing_multi_select)
        if (str.startsWith("[")) {
            try {
                const arr = JSON.parse(str);
                if (Array.isArray(arr)) {
                    for (const item of arr) {
                        const s = String(item);
                        if (s) counts[name][s] = (counts[name][s] || 0) + 1;
                    }
                    continue;
                }
            } catch { /* not JSON, treat as plain string */ }
        }

        // Handle JSON object values (pricing_quantity): sum quantities per option,
        // translating opt.id / opt.name keys to opt.name so OptionCounts stays name-keyed.
        if (str.startsWith("{") && quantityFields[name]) {
            try {
                const obj = JSON.parse(str);
                if (obj && typeof obj === "object" && !Array.isArray(obj)) {
                    const keyToName = quantityFields[name];
                    for (const [key, qty] of Object.entries(obj)) {
                        const optName = keyToName[key] ?? key;
                        const n = Number(qty) || 0;
                        if (n > 0) counts[name][optName] = (counts[name][optName] || 0) + n;
                    }
                    continue;
                }
            } catch { /* not JSON, treat as plain string */ }
        }

        counts[name][str] = (counts[name][str] || 0) + 1;
    }
}

export const getOptionPeopleForYear = cache(async (yearId: string, personFieldName: string): Promise<OptionPeople> => {
    const submissions = await db.registrationSubmission.findMany({
        where: {
            yearId,
            isTest: false,
            status: { notIn: ["CANCELLED", "REJECTED"] },
        },
        select: { data: true },
    });

    const people: OptionPeople = {};

    function collectPeople(data: Record<string, unknown>, personLabel: string): void {
        for (const [name, val] of Object.entries(data)) {
            if (name === "additionalPeople") continue;
            const str = String(val ?? "");
            if (!str || str === "false") continue;
            if (!people[name]) people[name] = {};

            // Handle JSON array values (pricing_multi_select)
            if (str.startsWith("[")) {
                try {
                    const arr = JSON.parse(str);
                    if (Array.isArray(arr)) {
                        for (const item of arr) {
                            const s = String(item);
                            if (!s) continue;
                            if (!people[name][s]) people[name][s] = [];
                            people[name][s].push(personLabel);
                        }
                        continue;
                    }
                } catch { /* not JSON, treat as plain string */ }
            }

            if (!people[name][str]) people[name][str] = [];
            people[name][str].push(personLabel);
        }
    }

    for (const sub of submissions) {
        const data = sub.data as Record<string, unknown>;
        const mainLabel = String(data[personFieldName] ?? "");
        if (mainLabel) {
            collectPeople(data, mainLabel);
        }
        const ap = data.additionalPeople;
        if (Array.isArray(ap)) {
            for (const person of ap) {
                if (person && typeof person === "object") {
                    const personData = person as Record<string, unknown>;
                    const apLabel = String(personData[personFieldName] ?? "") || mainLabel;
                    if (apLabel) {
                        collectPeople(personData, apLabel);
                    }
                }
            }
        }
    }
    return people;
});

async function computeOptionCounts(yearId: string): Promise<OptionCounts> {
    const [submissions, form] = await Promise.all([
        db.registrationSubmission.findMany({
            where: {
                yearId,
                isTest: false,
                status: { notIn: ["CANCELLED", "REJECTED"] },
            },
            select: { data: true },
        }),
        db.registrationForm.findUnique({
            where: { yearId },
            select: { fields: true },
        }),
    ]);

    const quantityFields = buildQuantityFieldMap(form?.fields);

    const counts: OptionCounts = {};
    for (const sub of submissions) {
        const data = sub.data as Record<string, unknown>;
        // Count main person values
        countValues(counts, data, quantityFields);
        // Count additional people values
        const ap = data.additionalPeople;
        if (Array.isArray(ap)) {
            for (const person of ap) {
                if (person && typeof person === "object") {
                    countValues(counts, person as Record<string, unknown>, quantityFields);
                }
            }
        }
    }
    return counts;
}

function buildQuantityFieldMap(rawFields: unknown): QuantityFieldMap {
    if (!rawFields) return {};
    const formData = migrateFormData(rawFields);
    const inputFields = getAllInputFields(formData.fields);
    const map: QuantityFieldMap = {};
    for (const field of inputFields) {
        if (field.type !== "pricing_quantity" || !field.pricingId) continue;
        const def = formData.pricingDefinitions.find((d) => d.id === field.pricingId);
        if (!def) continue;
        const keyToName: Record<string, string> = {};
        for (const opt of def.options) {
            keyToName[opt.id] = opt.name;
            keyToName[opt.name] = opt.name;
        }
        map[field.name] = keyToName;
    }
    return map;
}
