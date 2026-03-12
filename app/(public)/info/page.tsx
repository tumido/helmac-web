import { Suspense } from "react";
import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { InfoContent, RegistrationStats } from "@/components/public/features/info";
import { getInfoSectionsForActiveYear, getActiveYear, getOptionCountsForYear, getRegistrationFormForYear, getOptionPeopleForYear } from "@/lib/services";
import { migrateFormData } from "@/lib/utils/form-migration";
import { getAllInputFields } from "@/lib/types/registration-form";

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

            if (config?.enabled && config.fieldIds.length > 0) {
                const allInputFields = getAllInputFields(formData.fields);
                const trackedFields = allInputFields.filter((f) => config.fieldIds.includes(f.id));

                if (trackedFields.length > 0) {
                    const optionCounts = await getOptionCountsForYear(activeYear.id);

                    let optionPeople;
                    if (config.showPeople && config.personFieldId) {
                        const personField = allInputFields.find((f) => f.id === config.personFieldId);
                        if (personField) {
                            optionPeople = await getOptionPeopleForYear(activeYear.id, personField.name);
                        }
                    }

                    statsContent = (
                        <RegistrationStats
                            fields={trackedFields}
                            optionCounts={optionCounts}
                            optionPeople={optionPeople}
                            showPeople={config.showPeople}
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
