import {
    Container,
    Typography,
    Card,
    CardContent,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    Divider,
} from "@mui/material";
import {
    CalendarMonth,
    Article,
    Newspaper,
    PhotoLibrary,
    Image as ImageIcon,
    Add,
    Edit,
    Schedule,
    VisibilityOff,
} from "@mui/icons-material";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { LinkButton } from "@/components/ui/link-button";

async function getStats() {
    const [yearsCount, pagesCount, newsCount, albumsCount, imagesCount] = await Promise.all([
        db.year.count(),
        db.page.count(),
        db.news.count(),
        db.album.count(),
        db.image.count(),
    ]);

    return { yearsCount, pagesCount, newsCount, albumsCount, imagesCount };
}

async function getRecentActivity() {
    const [recentNews, recentPages, recentAlbums] = await Promise.all([
        db.news.findMany({
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                updatedAt: true,
                year: { select: { id: true } },
            },
        }),
        db.page.findMany({
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                updatedAt: true,
                year: { select: { id: true } },
            },
        }),
        db.album.findMany({
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
                id: true,
                title: true,
                updatedAt: true,
            },
        }),
    ]);

    const activities = [
        ...recentNews.map((n) => ({
            id: n.id,
            title: n.title,
            type: "news" as const,
            updatedAt: n.updatedAt,
            href: `/admin/novinky/${n.id}`,
        })),
        ...recentPages.map((p) => ({
            id: p.id,
            title: p.title,
            type: "page" as const,
            updatedAt: p.updatedAt,
            href: `/admin/rocniky/${p.year.id}/stranky/${p.id}`,
        })),
        ...recentAlbums.map((a) => ({
            id: a.id,
            title: a.title,
            type: "album" as const,
            updatedAt: a.updatedAt,
            href: `/admin/galerie/${a.id}`,
        })),
    ];

    return activities
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 8);
}

async function getPendingItems() {
    const unpublishedPages = await db.page.findMany({
        where: { isPublished: false },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            id: true,
            title: true,
            year: { select: { id: true, year: true } },
        },
    });

    return {
        pages: unpublishedPages,
    };
}

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "prave ted";
    if (minutes < 60) return `pred ${minutes} min`;
    if (hours < 24) return `pred ${hours} hod`;
    if (days < 7) return `pred ${days} dny`;
    return date.toLocaleDateString("cs-CZ");
}

function getActivityIcon(type: "news" | "page" | "album") {
    switch (type) {
        case "news":
            return <Newspaper fontSize="small" />;
        case "page":
            return <Article fontSize="small" />;
        case "album":
            return <PhotoLibrary fontSize="small" />;
    }
}

function getActivityLabel(type: "news" | "page" | "album") {
    switch (type) {
        case "news":
            return "Novinka";
        case "page":
            return "Stranka";
        case "album":
            return "Album";
    }
}

export default async function AdminDashboardPage() {
    const session = await auth();
    const [stats, activities, pending] = await Promise.all([
        getStats(),
        getRecentActivity(),
        getPendingItems(),
    ]);

    const statCards = [
        {
            title: "Rocniky",
            value: stats.yearsCount,
            icon: CalendarMonth,
            color: "#1976d2",
        },
        {
            title: "Stranky",
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
        {
            title: "Obrazky",
            value: stats.imagesCount,
            icon: ImageIcon,
            color: "#00838f",
        },
    ];

    const quickActions = [
        { label: "Nova novinka", href: "/admin/novinky/nova", icon: Add },
        { label: "Nove album", href: "/admin/galerie/nove", icon: Add },
        { label: "Novy rocnik", href: "/admin/rocniky/novy", icon: Add },
    ];

    const totalPending = pending.pages.length;

    return (
        <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 4 }}>
                Vitejte, {session?.user?.name || "Admine"}!
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

            {/* Main Content Grid */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
                    gap: 3,
                }}
            >
                {/* Recent Activity */}
                <Card>
                    <CardContent>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 2,
                            }}
                        >
                            <Schedule color="action" />
                            <Typography variant="h6">
                                Posledni aktivita
                            </Typography>
                        </Box>
                        {activities.length === 0 ? (
                            <Typography color="text.secondary">
                                Zadna nedavna aktivita.
                            </Typography>
                        ) : (
                            <List disablePadding>
                                {activities.map((activity, index) => (
                                    <Box key={`${activity.type}-${activity.id}`}>
                                        {index > 0 && <Divider />}
                                        <ListItem
                                            disablePadding
                                            sx={{ py: 1 }}
                                            secondaryAction={
                                                <LinkButton
                                                    href={activity.href}
                                                    size="small"
                                                    startIcon={<Edit />}
                                                >
                                                    Upravit
                                                </LinkButton>
                                            }
                                        >
                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                {getActivityIcon(activity.type)}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={activity.title}
                                                secondary={
                                                    <Box
                                                        component="span"
                                                        sx={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 1,
                                                        }}
                                                    >
                                                        <Chip
                                                            label={getActivityLabel(activity.type)}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ height: 20, fontSize: "0.7rem" }}
                                                        />
                                                        {formatRelativeTime(activity.updatedAt)}
                                                    </Box>
                                                }
                                                primaryTypographyProps={{
                                                    noWrap: true,
                                                    sx: { maxWidth: "70%" },
                                                }}
                                            />
                                        </ListItem>
                                    </Box>
                                ))}
                            </List>
                        )}
                    </CardContent>
                </Card>

                {/* Right Column */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* Quick Actions */}
                    <Card>
                        <CardContent>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 2,
                                }}
                            >
                                <Add color="action" />
                                <Typography variant="h6">
                                    Rychle akce
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 1.5,
                                }}
                            >
                                {quickActions.map((action) => (
                                    <LinkButton
                                        key={action.href}
                                        href={action.href}
                                        variant="outlined"
                                        startIcon={<action.icon />}
                                    >
                                        {action.label}
                                    </LinkButton>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Pending Items */}
                    <Card>
                        <CardContent>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 2,
                                }}
                            >
                                <VisibilityOff color="action" />
                                <Typography variant="h6">
                                    Nepublikovane ({totalPending})
                                </Typography>
                            </Box>
                            {totalPending === 0 ? (
                                <Typography color="text.secondary">
                                    Vse je publikovano.
                                </Typography>
                            ) : (
                                <List disablePadding dense>
                                    {pending.pages.map((item, index) => (
                                        <Box key={item.id}>
                                            {index > 0 && <Divider />}
                                            <ListItem
                                                disablePadding
                                                sx={{ py: 0.5 }}
                                                secondaryAction={
                                                    <LinkButton
                                                        href={`/admin/rocniky/${item.year.id}/stranky/${item.id}`}
                                                        size="small"
                                                    >
                                                        Upravit
                                                    </LinkButton>
                                                }
                                            >
                                                <ListItemIcon sx={{ minWidth: 32 }}>
                                                    <Article fontSize="small" color="action" />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={item.title}
                                                    secondary={`Rocnik ${item.year.year}`}
                                                    primaryTypographyProps={{
                                                        noWrap: true,
                                                        variant: "body2",
                                                        sx: { maxWidth: "65%" },
                                                    }}
                                                    secondaryTypographyProps={{
                                                        variant: "caption",
                                                    }}
                                                />
                                            </ListItem>
                                        </Box>
                                    ))}
                                </List>
                            )}
                        </CardContent>
                    </Card>
                </Box>
            </Box>
        </Container>
    );
}
