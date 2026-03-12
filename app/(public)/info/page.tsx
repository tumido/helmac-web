import { Suspense } from "react";
import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { InfoContent, RegistrationStats } from "@/components/public/features/info";
import { getInfoSectionsForActiveYear, getActiveYear, getOptionCountsForYear, getRegistrationFormForYear, getOptionPeopleForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields } from "@/lib/types/registration-form";
import type { InputField, OptionPeople } from "@/lib/types/registration-form";

export const metadata = {
    title: "Info | Helmac",
    description: "Důležité informace pro účastníky akce Helmac",
};

export default async function InfoPage() {
    const [infoSections, activeYear] = await Promise.all([
        getInfoSectionsForActiveYear(),
        getActiveYear(),
    ]);

    let statsContent: React.ReactNode = null;

    if (activeYear) {
        const registrationForm = await getRegistrationFormForYear(activeYear.id);
        if (registrationForm) {
            const formData = migrateFormData(registrationForm.fields);
            const config = formData.infoStatsConfig;

            if (config?.enabled && config.stats.length > 0) {
                const allInputFields = getAllInputFields(formData.fields);
                const allInputFieldsMap = new Map<string, InputField>(
                    allInputFields.map((f) => [f.id, f]),
                );

                const validStats = config.stats.filter((s) => allInputFieldsMap.has(s.fieldId));

                if (validStats.length > 0) {
                    const optionCounts = await getOptionCountsForYear(activeYear.id);

                    // Collect unique personFieldIds from stats with showPeople=true
                    const uniquePersonFieldIds = new Set<string>();
                    for (const stat of validStats) {
                        if (stat.showPeople && stat.personFieldId) {
                            uniquePersonFieldIds.add(stat.personFieldId);
                        }
                    }

                    // Fetch optionPeople for each unique person field
                    const optionPeopleMap: Record<string, OptionPeople> = {};
                    for (const personFieldId of uniquePersonFieldIds) {
                        const personField = allInputFieldsMap.get(personFieldId);
                        if (personField) {
                            optionPeopleMap[personFieldId] = await getOptionPeopleForYear(activeYear.id, personField.name);
                        }
                    }

                    // Build a plain fieldsMap record for the client component
                    const fieldsMap: Record<string, InputField> = {};
                    for (const stat of validStats) {
                        const field = allInputFieldsMap.get(stat.fieldId);
                        if (field) fieldsMap[stat.fieldId] = field;
                    }

                    statsContent = (
                        <RegistrationStats
                            stats={validStats}
                            fieldsMap={fieldsMap}
                            optionCounts={optionCounts}
                            optionPeopleMap={optionPeopleMap}
                            capacityLimits={formData.capacityLimits}
                        />
                    );
                }
            }
        }
    }

    return (
        <>
            <PageHeader
                title="Informace"
                subtitle="Důležité informace pro účastníky"
                backgroundImage={activeYear?.headerPhoto || undefined}
            />
            <Container maxWidth="md" sx={{ pb: 8 }}>
                <Suspense>
                    <InfoContent
                        infoSections={infoSections}
                        statsContent={statsContent}
                    />
                </Suspense>
            </Container>
        </>
    );
}
