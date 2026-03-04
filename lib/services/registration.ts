import { cache } from "react";
import { db } from "@/lib/db";

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
