import { Typography, Box, Grid, Chip, Paper } from "@mui/material";
import { redirect } from "next/navigation";
import { getPublicSession } from "@/lib/public-auth";
import {
    getPublicUserProfile,
    getPublicUserRegistrations,
} from "@/lib/services/public-user";
import { getGlobalBankAccount } from "@/lib/services/bank-account";
import { runPaymentSync } from "@/lib/utils/sync-payments";
import {
    formatCzechAccount,
    czechAccountToIBAN,
    generateSPAYD,
} from "@/lib/utils/spayd";
import { formatDate } from "@/lib/utils/date";
import { GameIcon } from "@/lib/icons";
import { AccountStatTile } from "@/components/public/ui/AccountStatTile";
import { RegistrationHistoryTable } from "@/components/public/features/account/registration-detail-dialog";
import { ChangePasswordForm } from "@/components/forms/change-password-form";

export default async function AccountPage() {
    const session = await getPublicSession();
    if (!session) {
        redirect(
            "/api/public/signout?redirect=" +
                encodeURIComponent("/vytvorit-ucet?deleted=1")
        );
    }

    await runPaymentSync();

    const [profile, registrations, globalBank] = await Promise.all([
        getPublicUserProfile(session.sub),
        getPublicUserRegistrations(session.sub),
        getGlobalBankAccount(),
    ]);

    if (!profile) return null;

    const realRegistrations = registrations.filter((r) => !r.isTest);
    const totalRegistrations = realRegistrations.length;
    const pendingCount = realRegistrations.filter((r) => !r.isPaid).length;

    const hasBankInfo = !!(
        globalBank?.bankAccountNumber && globalBank?.bankAccountBankCode
    );
    const bankAccountFormatted = hasBankInfo
        ? formatCzechAccount(
              globalBank!.bankAccountNumber!,
              globalBank!.bankAccountBankCode!,
              globalBank!.bankAccountPrefix ?? undefined
          )
        : "–";

    const serializedRegistrations = registrations.map((reg) => ({
        ...reg,
        createdAt: reg.createdAt.toISOString(),
        paidAt: reg.paidAt?.toISOString() ?? null,
    }));

    const spaydStrings: Record<string, string> = {};
    if (hasBankInfo) {
        const iban = czechAccountToIBAN(
            globalBank!.bankAccountNumber!,
            globalBank!.bankAccountBankCode!,
            globalBank!.bankAccountPrefix ?? undefined
        );
        if (iban) {
            for (const reg of registrations) {
                if (reg.isTest) continue;
                if (
                    !reg.isPaid &&
                    reg.variableSymbol &&
                    reg.totalPrice != null
                ) {
                    spaydStrings[reg.id] = generateSPAYD({
                        iban,
                        amount: reg.totalPrice,
                        variableSymbol: reg.variableSymbol,
                    });
                }
            }
        }
    }

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Account info + quick stats */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 4,
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            mb: 2,
                        }}
                    >
                        <GameIcon
                            name="bookshelf"
                            sx={{
                                fontSize: "1.8rem",
                                color: "primary.main",
                            }}
                        />
                        <Typography variant="h5" component="h2">
                            Informace o účtu
                        </Typography>
                    </Box>
                    <Paper
                        variant="outlined"
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2.5,
                            p: { xs: 2, md: 3 },
                            borderRadius: 2,
                        }}
                    >
                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                Email
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 0.5,
                                }}
                            >
                                <Typography variant="body1">
                                    {profile.email}
                                </Typography>
                                {profile.emailVerified && (
                                    <Chip
                                        icon={<GameIcon name="wax-seal" />}
                                        label="Ověřen"
                                        color="success"
                                        size="small"
                                    />
                                )}
                            </Box>
                        </Box>

                        <Box>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                }}
                            >
                                Účet vytvořen
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 0.5 }}>
                                {formatDate(profile.createdAt)}
                            </Typography>
                        </Box>
                    </Paper>
                </Box>

                <Grid
                    container
                    spacing={0}
                    sx={{
                        flex: 2,
                        minWidth: 0,
                        justifyContent: { xs: "center", md: "end" },
                    }}
                >
                    <AccountStatTile
                        icon="tied-scroll"
                        href="#registrace"
                        value={totalRegistrations}
                        label={
                            totalRegistrations === 1
                                ? "Registrace"
                                : "Registrací"
                        }
                    />
                    <AccountStatTile
                        icon="crown-coin"
                        href="#registrace"
                        value={pendingCount}
                        highlighted={pendingCount > 0}
                        label={
                            pendingCount === 1
                                ? "Nezaplacená platba"
                                : "Nezaplacených plateb"
                        }
                    />
                    <AccountStatTile
                        icon="open-treasure-chest"
                        label="Dokoupit balíčky"
                        disabled
                    />
                    <AccountStatTile
                        icon="anvil-impact"
                        label="Přihlásit na workshopy"
                        disabled
                    />
                    <AccountStatTile
                        icon="meeple-group"
                        label="Přidat lidi do registrace"
                        disabled
                    />
                </Grid>
            </Box>

            {/* Registrations & orders */}
            <Box id="registrace" sx={{ scrollMarginTop: 80 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2,
                    }}
                >
                    <GameIcon
                        name="tied-scroll"
                        sx={{
                            fontSize: "1.8rem",
                            color: "primary.main",
                        }}
                    />
                    <Typography variant="h5" component="h2">
                        Registrace a objednávky
                    </Typography>
                </Box>
                {serializedRegistrations.length === 0 ? (
                    <Paper
                        variant="outlined"
                        sx={{
                            p: { xs: 2, md: 3 },
                            borderRadius: 2,
                            textAlign: "center",
                        }}
                    >
                        <Typography color="text.secondary">
                            Zatím nemáte žádné registrace přiřazené k vašemu
                            účtu.
                        </Typography>
                    </Paper>
                ) : (
                    <Paper
                        variant="outlined"
                        sx={{
                            overflow: "hidden",
                            borderRadius: 2,
                        }}
                    >
                        <RegistrationHistoryTable
                            registrations={serializedRegistrations}
                            paymentInfo={{
                                bankAccount: bankAccountFormatted,
                                spaydStrings,
                            }}
                        />
                    </Paper>
                )}
            </Box>

            {/* Password change */}
            <Box sx={{ maxWidth: 480 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2,
                    }}
                >
                    <GameIcon
                        name="skeleton-key"
                        sx={{
                            fontSize: "1.8rem",
                            color: "primary.main",
                        }}
                    />
                    <Typography variant="h5" component="h2">
                        Změna hesla
                    </Typography>
                </Box>
                <ChangePasswordForm />
            </Box>
        </Box>
    );
}
