import { Container } from "@mui/material";
import { YearForm } from "@/components/forms/year-form";
import { PageHeader } from "@/components/admin/page-header";

export default function NewYearPage() {
    return (
        <Container maxWidth="md">
            <PageHeader
                breadcrumbs={[
                    { label: "Rocniky", href: "/admin/rocniky" },
                    { label: "Novy rocnik" },
                ]}
                title="Novy rocnik"
            />

            <YearForm mode="create" />
        </Container>
    );
}
