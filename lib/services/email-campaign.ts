import "server-only";
import { getFormStructure } from "@/lib/services/v2";

/**
 * Placeholder keys available to a mass-email body for a given year: every form
 * field (by `name`) plus the fixed computed placeholders. Read from the v2 form
 * structure.
 */
export async function buildCampaignPlaceholders(
    yearId: string,
): Promise<{ key: string; label: string }[]> {
    const structure = await getFormStructure(yearId);
    const fields = structure?.fields ?? [];

    return [
        ...fields.map((f) => ({ key: f.name, label: f.label })),
        { key: "variabilniSymbol", label: "Variabilní symbol" },
        { key: "celkovaCena", label: "Celková cena" },
        { key: "cisloUctu", label: "Číslo účtu" },
        { key: "iban", label: "IBAN" },
        { key: "swift", label: "SWIFT" },
        { key: "rok", label: "Rok" },
        { key: "nazevRocniku", label: "Název ročníku" },
        { key: "podtitulek", label: "Podtitulek" },
    ];
}
