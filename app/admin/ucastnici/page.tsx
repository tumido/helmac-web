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
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";

async function getPublicUsers() {
    return db.publicUser.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            email: true,
            emailVerified: true,
            createdAt: true,
            _count: {
                select: { registrations: true },
            },
        },
    });
}

export default async function PublicUsersPage() {
    try {
        await requireAdmin();
    } catch {
        redirect("/admin");
    }

    const users = await getPublicUsers();

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[{ label: "Účastníci" }]}
                title="Účastníci"
            />

            <Card>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Ověřen</TableCell>
                                <TableCell>Registrací</TableCell>
                                <TableCell>Vytvořen</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{ py: 4 }}
                                        >
                                            Zatím žádní účastníci
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
                                        <TableCell>{user._count.registrations}</TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString("cs-CZ")}
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
