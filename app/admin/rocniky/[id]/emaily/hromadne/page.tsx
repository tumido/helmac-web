import {
    Box,
    Card,
    Chip,
    Container,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { LinkButton } from "@/components/ui/link-button";
import { CAMPAIGN_STATUS_CONFIG } from "./campaign-status";

export const dynamic = "force-dynamic";

interface HromadnePageProps {
    params: Promise<{ id: string }>;
}

export default async function HromadnePage({ params }: HromadnePageProps) {
    const { id } = await params;
    const year = await db.year.findUnique({
        where: { id },
        select: { id: true, year: true },
    });

    if (!year) {
        notFound();
    }

    const campaigns = await db.emailCampaign.findMany({
        where: { yearId: id },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            status: true,
            totalCount: true,
            createdAt: true,
        },
    });

    const counts = await db.emailQueueItem.groupBy({
        by: ["campaignId", "status"],
        where: { campaignId: { in: campaigns.map((c) => c.id) } },
        _count: { _all: true },
    });

    function countFor(campaignId: string, status: string): number {
        return (
            counts.find(
                (c) => c.campaignId === campaignId && c.status === status,
            )?._count._all ?? 0
        );
    }

    return (
        <Container maxWidth="lg">
            <PageHeader
                breadcrumbs={[
                    { label: "Ročníky", href: "/admin/rocniky" },
                    { label: `${year.year}`, href: `/admin/rocniky/${year.id}` },
                    { label: "Emaily", href: `/admin/rocniky/${year.id}/emaily` },
                    { label: "Hromadné emaily" },
                ]}
                title="Hromadné emaily"
            />

            <Box sx={{ mb: 3 }}>
                <LinkButton
                    href={`/admin/rocniky/${year.id}/emaily/hromadne/novy`}
                    variant="contained"
                    startIcon={<Add />}
                >
                    Nová kampaň
                </LinkButton>
            </Box>

            {campaigns.length === 0 ? (
                <Typography color="text.secondary">
                    Zatím žádné kampaně.
                </Typography>
            ) : (
                <Card variant="outlined">
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Název</TableCell>
                                <TableCell>Stav</TableCell>
                                <TableCell>Odesláno</TableCell>
                                <TableCell>Neúspěšné</TableCell>
                                <TableCell>Vytvořeno</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {campaigns.map((campaign) => {
                                const statusConfig =
                                    CAMPAIGN_STATUS_CONFIG[campaign.status] ??
                                    CAMPAIGN_STATUS_CONFIG.DRAFT;
                                const failed = countFor(campaign.id, "failed");
                                return (
                                    <TableRow key={campaign.id} hover>
                                        <TableCell>{campaign.name}</TableCell>
                                        <TableCell>
                                            <Chip
                                                size="small"
                                                label={statusConfig.label}
                                                color={statusConfig.color}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {campaign.status === "DRAFT"
                                                ? "—"
                                                : `${countFor(campaign.id, "sent")} / ${campaign.totalCount}`}
                                        </TableCell>
                                        <TableCell>
                                            {failed > 0 ? (
                                                <Chip
                                                    size="small"
                                                    label={failed}
                                                    color="error"
                                                />
                                            ) : (
                                                "—"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {campaign.createdAt.toLocaleDateString(
                                                "cs-CZ",
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <LinkButton
                                                href={`/admin/rocniky/${year.id}/emaily/hromadne/${campaign.id}`}
                                                variant="outlined"
                                                size="small"
                                            >
                                                Detail
                                            </LinkButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </Container>
    );
}
