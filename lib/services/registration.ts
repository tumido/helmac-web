import { cache } from "react";
import { db } from "@/lib/db";
import type { OptionCounts, OptionPeople } from "@/lib/types/registration-form";

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
            registrationForm: {
                select: { id: true, fields: true },
            },
            _count: {
                select: { registrationSubmissions: true },
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
        where: { yearId },
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

function countValues(counts: OptionCounts, data: Record<string, unknown>): void {
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

        counts[name][str] = (counts[name][str] || 0) + 1;
    }
}

export const getOptionPeopleForYear = cache(async (yearId: string, personFieldName: string): Promise<OptionPeople> => {
    const submissions = await db.registrationSubmission.findMany({
        where: {
            yearId,
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
    const submissions = await db.registrationSubmission.findMany({
        where: {
            yearId,
            status: { notIn: ["CANCELLED", "REJECTED"] },
        },
        select: { data: true },
    });

    const counts: OptionCounts = {};
    for (const sub of submissions) {
        const data = sub.data as Record<string, unknown>;
        // Count main person values
        countValues(counts, data);
        // Count additional people values
        const ap = data.additionalPeople;
        if (Array.isArray(ap)) {
            for (const person of ap) {
                if (person && typeof person === "object") {
                    countValues(counts, person as Record<string, unknown>);
                }
            }
        }
    }
    return counts;
}
