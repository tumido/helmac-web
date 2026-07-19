import { getRegistrationFormForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields } from "@/lib/types/registration-form";

export async function buildCampaignPlaceholders(
    yearId: string,
): Promise<{ key: string; label: string }[]> {
    const registrationForm = await getRegistrationFormForYear(yearId);
    const formData = registrationForm
        ? migrateFormData(registrationForm.fields)
        : null;
    const allInputFields = formData ? getAllInputFields(formData.fields) : [];

    return [
        ...allInputFields.map((f) => ({ key: f.name, label: f.label })),
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
