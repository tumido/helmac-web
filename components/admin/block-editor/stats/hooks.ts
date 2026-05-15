"use client";

import { useEffect, useState, useTransition } from "react";
import {
    getRegistrationFields,
    getRegistrationStatsPreview,
    type RegistrationFieldInfo,
} from "@/lib/actions/registration-fields";
import type { RegistrationStats } from "@/lib/services/registration";

export function useRegistrationFields(yearId?: string) {
    const [fields, setFields] = useState<
        RegistrationFieldInfo[] | null
    >(null);
    const [, startLoad] = useTransition();

    useEffect(() => {
        if (!yearId) return;
        startLoad(async () => {
            const result =
                await getRegistrationFields(yearId);
            setFields(result);
        });
    }, [yearId]);

    return fields;
}

export function useRegistrationStats(
    yearId?: string,
    filter?: Record<string, unknown>
) {
    const [stats, setStats] =
        useState<RegistrationStats | null>(null);
    const filterKey = JSON.stringify(filter ?? null);
    const [, startLoad] = useTransition();

    useEffect(() => {
        if (!yearId) return;
        const parsed = JSON.parse(filterKey);
        const hasFilter =
            parsed &&
            (parsed.statuses?.length ||
                parsed.isPaid !== undefined ||
                parsed.fieldFilters?.length);
        startLoad(async () => {
            const result =
                await getRegistrationStatsPreview(
                    yearId,
                    hasFilter ? parsed : undefined
                );
            setStats(result);
        });
    }, [yearId, filterKey]);

    return stats;
}
