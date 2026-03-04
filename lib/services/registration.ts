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
            _count: {
                select: { registrations: true },
            },
        },
    });

    if (!activeYear) {
        return {
            isOpen: false,
            year: null,
            registrationCount: 0,
            registrationStartDate: null,
        };
    }

    return {
        isOpen: activeYear.registrationOpen,
        year: activeYear,
        registrationCount: activeYear._count.registrations,
        registrationStartDate: activeYear.registrationStartDate,
    };
});

export const checkDuplicateRegistration = cache(
    async (yearId: string, email: string) => {
        const existing = await db.registration.findFirst({
            where: {
                yearId,
                email: email.toLowerCase(),
            },
            select: { id: true },
        });

        return !!existing;
    }
);

export const getRegistrationById = cache(async (id: string) => {
    return db.registration.findUnique({
        where: { id },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            nickname: true,
            email: true,
            status: true,
            isPaid: true,
            createdAt: true,
            year: {
                select: {
                    year: true,
                    title: true,
                },
            },
        },
    });
});
