import {
    Container,
    Typography,
    Box,
    Card,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Tooltip,
} from "@mui/material";
import { Add, Edit, Shield, Person, SupervisorAccount } from "@mui/icons-material";
import { LinkButton, IconLinkButton } from "@/components/ui/link-button";
import { db } from "@/lib/db";
import { auth, requireSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserActions } from "@/components/admin/user-actions";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

const roleLabels: Record<string, { label: string; color: "error" | "warning" | "info"; icon: React.ReactNode }> = {
    SUPER_ADMIN: {
        label: "Super Admin",
        color: "error",
        icon: <Shield />,
    },
    ADMIN: {
        label: "Admin",
        color: "warning",
        icon: <SupervisorAccount />,
    },
    EDITOR: {
        label: "Editor",
        color: "info",
        icon: <Person />,
    },
};

async function getUsers() {
    return db.user.findMany({
        orderBy: [{ role: "asc" }, { name: "asc" }],
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            _count: {
                select: { createdNews: true },
            },
        },
    });
}

export default async function UsersPage() {
    // Check permissions
    try {
        await requireSuperAdmin();
    } catch {
        redirect("/admin");
    }

    const session = await auth();
    const users = await getUsers();

    return (
        <Container maxWidth="lg">
            <AdminBreadcrumbs items={[{ label: "Uzivatele" }]} />
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                }}
            >
                <Typography variant="h4">Uzivatele</Typography>
                <LinkButton
                    href="/admin/uzivatele/novy"
                    variant="contained"
                    startIcon={<Add />}
                >
                    Novy uzivatel
                </LinkButton>
            </Box>

            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Jmeno</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Novinek</TableCell>
                                <TableCell>Vytvoren</TableCell>
                                <TableCell align="right">Akce</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => {
                                const roleInfo = roleLabels[user.role];
                                const isCurrentUser = session?.user?.id === user.id;

                                return (
                                    <TableRow
                                        key={user.id}
                                        sx={{
                                            backgroundColor: isCurrentUser
                                                ? "action.selected"
                                                : undefined,
                                        }}
                                    >
                                        <TableCell>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 1,
                                                }}
                                            >
                                                {user.name}
                                                {isCurrentUser && (
                                                    <Chip
                                                        label="Vy"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={roleInfo.label}
                                                color={roleInfo.color}
                                                size="small"
                                                icon={roleInfo.icon as React.ReactElement}
                                            />
                                        </TableCell>
                                        <TableCell>{user._count.createdNews}</TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString(
                                                "cs-CZ"
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    justifyContent: "flex-end",
                                                    gap: 0.5,
                                                }}
                                            >
                                                <Tooltip title="Upravit">
                                                    <IconLinkButton
                                                        href={`/admin/uzivatele/${user.id}`}
                                                        size="small"
                                                    >
                                                        <Edit />
                                                    </IconLinkButton>
                                                </Tooltip>
                                                <UserActions
                                                    userId={user.id}
                                                    userName={user.name}
                                                    isCurrentUser={isCurrentUser}
                                                />
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Container>
    );
}
