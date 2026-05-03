import {
    Paper,
    Typography,
    Box,
} from "@mui/material";
import { requirePublicAuth } from "@/lib/public-auth";
import { getPublicUserRegistrations } from "@/lib/services/public-user";
import { RegistrationHistoryTable } from "@/components/public/features/account/registration-detail-dialog";

export const metadata = {
    title: "Moje registrace | Helmáč",
};

export default async function RegistrationHistoryPage() {
    const session = await requirePublicAuth();
    const registrations = await getPublicUserRegistrations(session.sub);

    if (registrations.length === 0) {
        return (
            <Paper sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                    Zatím nemáte žádné registrace přiřazené k vašemu účtu.
                </Typography>
            </Paper>
        );
    }

    // Serialize dates for client component
    const serialized = registrations.map((reg) => ({
        ...reg,
        createdAt: reg.createdAt.toISOString(),
        paidAt: reg.paidAt?.toISOString() ?? null,
    }));

    return (
        <Paper sx={{ p: 0, overflow: "hidden" }}>
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6">
                    Historie registrací
                </Typography>
            </Box>
            <RegistrationHistoryTable registrations={serialized} />
        </Paper>
    );
}
