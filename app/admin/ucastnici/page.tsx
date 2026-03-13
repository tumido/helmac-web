import {
    Container,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Typography,
} from "@mui/material";
import { Box } from "@mui/material";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { ListFilters } from "@/components/admin/list-filters";
import { PublicUserActions } from "@/components/admin/public-user-actions";
import { formatDate } from "@/lib/utils/date";
import { Prisma } from "@prisma/client";

interface PageProps {
    searchParams: Promise<{ q?: string }>;
}

async function getPublicUsers(filters: { q?: string }) {
    const where: Prisma.PublicUserWhereInput = {};

    if (filters.q) {
        where.email = { contains: filters.q, mode: "insensitive" };
    }

    return db.publicUser.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            email: true,
            emailVerified: true,
            createdAt: true,
            _count: {
                select: { registrations: true },
            },
            registrations: {
                select: {
                    year: { select: { year: true } },
                },
                orderBy: { year: { year: "asc" } },
            },
        },
    });
}

export default async function PublicUsersPage({ searchParams }: PageProps) {
    try {
        await requireAdmin();
    } catch {
        redirect("/admin");
    }

    const params = await searchParams;
    const users = await getPublicUsers(params);

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[{ label: "Účastníci" }]}
                title="Účastníci"
            />

            <ListFilters searchPlaceholder="Hledat účastníky..." />

            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Ověřen</TableCell>
                                <TableCell>Registrací</TableCell>
                                <TableCell>Vytvořen</TableCell>
                                <TableCell>Akce</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ py: 4 }}
                                        >
                                            {params.q
                                                ? "Žádní účastníci neodpovídají filtru."
                                                : "Zatím žádní účastníci"}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={user.emailVerified ? "Ano" : "Ne"}
                                                color={user.emailVerified ? "success" : "default"}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {user.registrations.length > 0 ? (
                                                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                                                    {[...new Set(user.registrations.map((r) => r.year.year))].map((year) => (
                                                        <Chip key={year} label={year} size="small" variant="outlined" />
                                                    ))}
                                                </Box>
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(user.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <PublicUserActions
                                                userId={user.id}
                                                userEmail={user.email}
                                                registrationCount={user._count.registrations}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Container>
    );
}
