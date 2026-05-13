import type {
    InputField,
    PricingDefinition,
} from "@/lib/types/registration-form";
import { parseQuantities, parseSelected } from "@/lib/utils/pricing-field-values";

/**
 * Post-redesign, pricing fields persist option *ids* in the submission JSON
 * (form Selects/MultiSelects use opt.id as their value). For display contexts
 * — emails, admin views, anything `String(value)` would land in — we resolve
 * those ids back to human-readable names. Legacy submissions (option names)
 * pass through unchanged.
 */
export function resolveSubmissionDataForDisplay(
    submissionData: Record<string, unknown>,
    allInputFields: InputField[],
    pricingDefinitions: PricingDefinition[],
): Record<string, unknown> {
    const out: Record<string, unknown> = { ...submissionData };
    for (const field of allInputFields) {
        if (!field.pricingId) continue;
        const def = pricingDefinitions.find((d) => d.id === field.pricingId);
        if (!def) continue;

        const val = submissionData[field.name];
        if (val === null || val === undefined || val === "") continue;

        if (field.type === "pricing_select") {
            const key = String(val);
            const opt =
                def.options.find((o) => o.id === key) ??
                def.options.find((o) => o.name === key);
            if (opt) out[field.name] = opt.name;
        } else if (field.type === "pricing_multi_select") {
            const selected = parseSelected(val);
            if (selected.length === 0) {
                out[field.name] = "";
                continue;
            }
            const names = selected.map((key) => {
                const opt =
                    def.options.find((o) => o.id === key) ??
                    def.options.find((o) => o.name === key);
                return opt?.name ?? key;
            });
            // buildPlaceholders parses "[" "]" JSON arrays and joins with ", " —
            // re-serialise so the same code path handles legacy submissions.
            out[field.name] = JSON.stringify(names);
        } else if (field.type === "pricing_quantity") {
            const qMap = parseQuantities(val);
            const entries: string[] = [];
            for (const opt of def.options) {
                const qty = Number(qMap[opt.id] ?? qMap[opt.name]) || 0;
                if (qty <= 0) continue;
                entries.push(`${opt.name}: ${qty}`);
            }
            out[field.name] = entries.join(", ");
        }
    }
    return out;
}
