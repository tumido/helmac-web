import { Paper, Typography, Box, Chip, Divider } from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import { requirePublicAuth } from "@/lib/public-auth";
import { getPublicUserProfile } from "@/lib/services/public-user";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { LogoutButton } from "@/components/public/features/account/logout-button";
import { formatDate } from "@/lib/utils/date";

export const metadata = {
    title: "Profil | Helmac",
};

export default async function ProfilePage() {
    const session = await requirePublicAuth();
    const profile = await getPublicUserProfile(session.sub);

    if (!profile) return null;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Informace o účtu
                </Typography>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Email
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                        <Typography>{profile.email}</Typography>
                        {profile.emailVerified && (
                            <Chip
                                icon={<CheckCircle />}
                                label="Ověřen"
                                color="success"
                                size="small"
                            />
                        )}
                    </Box>
                </Box>

                <Box>
                    <Typography variant="body2" color="text.secondary">
                        Účet vytvořen
                    </Typography>
                    <Typography sx={{ mt: 0.5 }}>
                        {formatDate(profile.createdAt)}
                    </Typography>
                </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Změna hesla
                </Typography>
                <ChangePasswordForm />
            </Paper>

            <Divider />

            <LogoutButton />
        </Box>
    );
}
