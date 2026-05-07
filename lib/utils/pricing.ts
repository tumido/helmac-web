import type {
    InputField,
    PricingDefinition,
    PricingSummaryData,
} from "@/lib/types/registration-form";

/**
 * Returns the index of the currently applicable price tier.
 * Tiers are compared by date: if `date` is before priceTiers[i], that tier applies.
 * If date is past all tiers, returns priceTiers.length (fallback index).
 */
export function getCurrentTierIndex(priceTiers: string[], date?: Date): number {
    const now = date ?? new Date();
    for (let i = 0; i < priceTiers.length; i++) {
        if (now <= new Date(priceTiers[i])) {
            return i;
        }
    }
    return priceTiers.length; // fallback tier
}

/**
 * Returns the currently applicable price for a given option's prices array.
 * prices[i] corresponds to priceTiers[i]; prices[priceTiers.length] is the fallback.
 */
export function getCurrentPrice(
    priceTiers: string[],
    prices: number[],
    date?: Date
): number {
    const idx = getCurrentTierIndex(priceTiers, date);
    return prices[idx] ?? prices[prices.length - 1] ?? 0;
}

/**
 * Formats a price in Czech format, e.g. 1000 → "1 000 Kč".
 */
export function formatPrice(price: number): string {
    return `${price.toLocaleString("cs-CZ")} Kč`;
}

/**
 * Returns option value strings for any field type.
 * For select/radio: returns field.options.
 * For pricing_select: looks up the definition and returns option names.
 * For others: returns empty array.
 */
export function getFieldOptionValues(
    field: InputField,
    pricingDefinitions?: PricingDefinition[]
): string[] {
    if (field.type === "select" || field.type === "radio") {
        return field.options ?? [];
    }
    if (
        (field.type === "pricing_select" ||
            field.type === "pricing_multi_select") &&
        field.pricingId &&
        pricingDefinitions
    ) {
        const def = pricingDefinitions.find((d) => d.id === field.pricingId);
        return def ? def.options.map((o) => o.name) : [];
    }
    if (field.type === "pricing_quantity") {
        return []; // Quantity fields use numeric values, not option names
    }
    return [];
}

/**
 * Returns the currently applicable price from a stored PricingSummaryData.
 * Walks the tiers by date (same logic as getCurrentTierIndex) but operates
 * on the pre-computed summary stored in the DB.
 */
export function getApplicablePriceFromSummary(summary: PricingSummaryData): {
    totalPrice: number;
    applicableTierIndex: number;
} {
    const now = new Date();
    for (let i = 0; i < summary.tiers.length; i++) {
        const tier = summary.tiers[i];
        if (tier.tierDate && now <= new Date(tier.tierDate)) {
            return { totalPrice: tier.totalPrice, applicableTierIndex: i };
        }
    }
    // Past all deadlines — use last tier (fallback)
    const last = summary.tiers[summary.tiers.length - 1];
    return {
        totalPrice: last?.totalPrice ?? 0,
        applicableTierIndex: summary.tiers.length - 1,
    };
}
