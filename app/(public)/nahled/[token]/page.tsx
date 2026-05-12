import { notFound } from "next/navigation";
import { Container, Alert } from "@mui/material";
import { db } from "@/lib/db";
import { DynamicRegistrationForm } from "@/components/public/features/registration/DynamicRegistrationForm";
import type { RegistrationFormData } from "@/lib/types/registration-form";

interface Props {
    params: Promise<{ token: string }>;
}

export default async function PublicFormPreviewPage({ params }: Props) {
    const { token } = await params;

    const preview = await db.formPreview.findUnique({
        where: { token },
    });

    if (!preview) {
        notFound();
    }

    const formData = preview.data as unknown as RegistrationFormData;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
                Toto je náhled formuláře. Odeslání formuláře nebude zaregistrováno.
            </Alert>

            <DynamicRegistrationForm
                formData={formData}
                previewMode
                previewYearId={preview.yearId}
            />
        </Container>
    );
}
