import {
    Container,
    Typography,
    Card,
    CardContent,
    Box,
} from "@mui/material";
import {
    CalendarMonth,
    Article,
    Newspaper,
    PhotoLibrary,
    CheckCircle,
    Warning,
    Edit,
} from "@mui/icons-material";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LinkButton } from "@/components/ui/link-button";

async function getStats() {
    const [yearsCount, pagesCount, newsCount, albumsCount] = await Promise.all([
        db.year.count(),
        db.page.count(),
        db.news.count(),
        db.album.count(),
    ]);

    return { yearsCount, pagesCount, newsCount, albumsCount };
}

async function getSetupStatus() {
    const [mainEmail, bankAccount] = await Promise.all([
        db.emailAccount.findFirst({ where: { isMain: true }, select: { id: true } }),
        db.bankAccount.findFirst({
            select: { bankAccountNumber: true, fioSyncEnabled: true },
        }),
    ]);

    return {
        hasMainEmail: !!mainEmail,
        hasBankAccount: !!bankAccount?.bankAccountNumber,
        hasFioSync: !!bankAccount?.fioSyncEnabled,
    };
}

export default async function AdminDashboardPage() {
    const session = await auth();
    const isAdminOrAbove =
        session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

    const [stats, activeYear, setupStatus] = await Promise.all([
        getStats(),
        db.year.findFirst({
            where: { isActive: true, isArchived: false },
            select: { id: true, year: true, title: true },
        }),
        isAdminOrAbove ? getSetupStatus() : null,
    ]);

    const statCards = [
        {
            title: "Ročníky",
            value: stats.yearsCount,
            icon: CalendarMonth,
            color: "#1976d2",
        },
        {
            title: "Stránky",
            value: stats.pagesCount,
            icon: Article,
            color: "#388e3c",
        },
        {
            title: "Novinky",
            value: stats.newsCount,
            icon: Newspaper,
            color: "#f57c00",
        },
        {
            title: "Alba",
            value: stats.albumsCount,
            icon: PhotoLibrary,
            color: "#7b1fa2",
        },
    ];

    const setupChecks = setupStatus
        ? [
              {
                  label: "Hlavní emailový účet",
                  ok: setupStatus.hasMainEmail,
                  href: "/admin/nastaveni/emaily",
              },
              {
                  label: "Bankovní účet",
                  ok: setupStatus.hasBankAccount,
                  href: "/admin/nastaveni/banka",
              },
              {
                  label: "Fio synchronizace",
                  ok: setupStatus.hasFioSync,
                  href: "/admin/nastaveni/banka",
              },
          ]
        : null;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Vítejte, {session?.user?.name || "Admine"}!
            </Typography>

            {/* Stats Cards */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "repeat(2, 1fr)",
                        sm: "repeat(3, 1fr)",
                        lg: "repeat(5, 1fr)",
                    },
                    gap: 2,
                    mb: 4,
                }}
            >
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Card key={card.title}>
                            <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1.5,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            p: 1,
                                            borderRadius: 1.5,
                                            backgroundColor: card.color,
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Icon fontSize="small" />
                                    </Box>
                                    <Box>
                                        <Typography
                                            variant="h5"
                                            fontWeight="bold"
                                        >
                                            {card.value}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            {card.title}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>

            {/* Setup Status (ADMIN / SUPER_ADMIN only) */}
            {setupChecks && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Stav nastavení
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                            {setupChecks.map((check) => (
                                <Box
                                    key={check.label}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {check.ok ? (
                                            <CheckCircle color="success" fontSize="small" />
                                        ) : (
                                            <Warning color="warning" fontSize="small" />
                                        )}
                                        <Typography variant="body2">
                                            {check.label}
                                        </Typography>
                                    </Box>
                                    {!check.ok && (
                                        <LinkButton
                                            href={check.href}
                                            size="small"
                                            variant="text"
                                        >
                                            Nastavit
                                        </LinkButton>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Active Year */}
            <Card>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Aktuální ročník
                    </Typography>
                    {activeYear ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography variant="body1">
                                {activeYear.title || `Ročník ${activeYear.year}`}
                            </Typography>
                            <LinkButton
                                href={`/admin/rocniky/${activeYear.id}`}
                                variant="contained"
                                startIcon={<Edit />}
                            >
                                Upravit ročník
                            </LinkButton>
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Žádný aktivní ročník
                            </Typography>
                            <LinkButton
                                href="/admin/rocniky"
                                variant="outlined"
                                size="small"
                            >
                                Spravovat ročníky
                            </LinkButton>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}
