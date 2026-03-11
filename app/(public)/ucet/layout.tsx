import { Container, Box } from "@mui/material";
import { PageHeader } from "@/components/public/ui";
import { AccountNav } from "@/components/public/features/account/account-nav";

export const metadata = {
    title: "Můj účet | Helmac",
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
            />
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                <Box
                    sx={{
                        display: "flex",
                        gap: 3,
                        flexDirection: { xs: "column", md: "row" },
                    }}
                >
                    <Box sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0 }}>
                        <AccountNav />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {children}
                    </Box>
                </Box>
            </Container>
        </>
    );
}
