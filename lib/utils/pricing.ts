import type { InputField, PricingDefinition } from "@/lib/types/registration-form";

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
export function getCurrentPrice(priceTiers: string[], prices: number[], date?: Date): number {
    const idx = getCurrentTierIndex(priceTiers, date);
    return prices[idx] ?? prices[prices.length - 1] ?? 0;
}

/**
 * Formats a price in Czech format, e.g. 1000 → "1 000 Kč".
 */
export function formatPrice(price: number): string {
    if (price < 0) {
        return `Sleva ${Math.abs(price).toLocaleString("cs-CZ")} Kč`;
    }
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
    pricingDefinitions?: PricingDefinition[],
): string[] {
    if (field.type === "select" || field.type === "radio") {
        return field.options ?? [];
    }
    if (field.type === "pricing_select" && field.pricingId && pricingDefinitions) {
        const def = pricingDefinitions.find((d) => d.id === field.pricingId);
        return def ? def.options.map((o) => o.name) : [];
    }
    return [];
}
