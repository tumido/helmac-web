import {
    Paper,
    Typography,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";
import { requirePublicAuth } from "@/lib/public-auth";
import { getPublicUserRegistrations } from "@/lib/services/public-user";

export const metadata = {
    title: "Moje registrace | Helmac",
};

const statusLabels: Record<string, { label: string; color: "default" | "success" | "warning" | "error" | "info" }> = {
    PENDING: { label: "Čeká na potvrzení", color: "warning" },
    CONFIRMED: { label: "Potvrzena", color: "success" },
    WAITLIST: { label: "Čekací listina", color: "info" },
    CANCELLED: { label: "Zrušena", color: "error" },
    REJECTED: { label: "Zamítnuta", color: "error" },
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

    return (
        <Paper sx={{ p: 0, overflow: "hidden" }}>
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6">
                    Historie registrací
                </Typography>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ročník</TableCell>
                            <TableCell>Datum</TableCell>
                            <TableCell>Stav</TableCell>
                            <TableCell align="right">Cena</TableCell>
                            <TableCell>Platba</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {registrations.map((reg) => {
                            const statusInfo = statusLabels[reg.status] || { label: reg.status, color: "default" as const };
                            return (
                                <TableRow key={reg.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {reg.year.title}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {reg.createdAt.toLocaleDateString("cs-CZ")}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={statusInfo.label}
                                            color={statusInfo.color}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        {reg.totalPrice ? `${reg.totalPrice} Kč` : "–"}
                                    </TableCell>
                                    <TableCell>
                                        {reg.isPaid ? (
                                            <Chip label="Zaplaceno" color="success" size="small" />
                                        ) : reg.totalPrice ? (
                                            <Chip label="Nezaplaceno" color="warning" size="small" />
                                        ) : (
                                            "–"
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
