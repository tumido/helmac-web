import { Paper, Typography, Box, Chip, Grid } from "@mui/material";
import { EventNote, Payment, CheckCircle } from "@mui/icons-material";
import { requirePublicAuth } from "@/lib/public-auth";
import { getPublicUserProfile, getPublicUserRegistrations } from "@/lib/services/public-user";

export default async function AccountDashboardPage() {
    const session = await requirePublicAuth();
    const [profile, registrations] = await Promise.all([
        getPublicUserProfile(session.sub),
        getPublicUserRegistrations(session.sub),
    ]);

    if (!profile) return null;

    const totalRegistrations = registrations.length;
    const paidCount = registrations.filter((r) => r.isPaid).length;
    const totalPaid = registrations
        .filter((r) => r.isPaid)
        .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Vítejte zpět
                </Typography>
                <Typography color="text.secondary">
                    {profile.email}
                </Typography>
                {profile.emailVerified && (
                    <Chip
                        icon={<CheckCircle />}
                        label="Email ověřen"
                        color="success"
                        size="small"
                        sx={{ mt: 1 }}
                    />
                )}
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 3, textAlign: "center" }}>
                        <EventNote sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                        <Typography variant="h4">
                            {totalRegistrations}
                        </Typography>
                        <Typography color="text.secondary">
                            {totalRegistrations === 1 ? "Registrace" : "Registrací"}
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 3, textAlign: "center" }}>
                        <Payment sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
                        <Typography variant="h4">
                            {paidCount > 0 ? `${totalPaid} Kč` : "–"}
                        </Typography>
                        <Typography color="text.secondary">
                            {paidCount} {paidCount === 1 ? "platba" : "plateb"}
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
