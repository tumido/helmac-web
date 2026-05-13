import { Container } from "@mui/material";
import { PageHeader } from "@/components/public/ui";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Můj účet | Helmáč",
};

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <PageHeader
                title="Můj účet"
                subtitle="Správa vašeho účtu a registrací"
                icon="visored-helm"
            />
            <Container maxWidth="lg" sx={{ pb: 8, mt: 4 }}>
                {children}
            </Container>
        </>
    );
}
