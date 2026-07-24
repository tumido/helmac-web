import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Container,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/page-header";
import { recipientFilterSchema } from "@/lib/validators/email-campaign";
import { CampaignForm } from "../campaign-form";
import { buildCampaignPlaceholders } from "@/lib/services/email-campaign";
import { EMAIL_QUEUE_CONFIG } from "@/lib/utils/email-queue";
import { CAMPAIGN_STATUS_CONFIG } from "../campaign-status";
import { CampaignDetailActions } from "./campaign-detail-actions";
import { MassEmailRecipientList } from "./mass-email-recipient-list";

export const dynamic = "force-dynamic";

// A SENDING campaign whose lock is idle this long with items still pending
// most likely lost its self-invocation chain. Centralized in EMAIL_QUEUE_CONFIG
// alongside the queue's other timing constants to keep them from drifting.
function isLockIdleTooLong(lockIdleSince: Date): boolean {
    return (
        Date.now() - lockIdleSince.getTime() >
        EMAIL_QUEUE_CONFIG.stalledAfterMs()
    );
}

interface KampanDetailPageProps {
    params: Promise<{ id: string; campaignId: string }>;
}

export default async function KampanDetailPage({
    params,
}: KampanDetailPageProps) {
    await requireAdmin();

    const { id, campaignId } = await params;

    const campaign = await db.emailCampaign.findUnique({
        where: { id: campaignId },
        select: {
            id: true,
            yearId: true,
            name: true,
            subject: true,
            body: true,
            bcc: true,
            accountId: true,
            status: true,
            recipientFilter: true,
            totalCount: true,
            lockedAt: true,
            startedAt: true,
            completedAt: true,
            updatedAt: true,
            year: { select: { year: true } },
        },
    });

    if (!campaign || campaign.yearId !== id) {
        notFound();
    }

    const statusConfig =
        CAMPAIGN_STATUS_CONFIG[campaign.status] ?? CAMPAIGN_STATUS_CONFIG.DRAFT;

    const breadcrumbs = [
        { label: "Ročníky", href: "/admin/rocniky" },
        { label: `${campaign.year.year}`, href: `/admin/rocniky/${id}` },
        { label: "Emaily", href: `/admin/rocniky/${id}/emaily` },
        {
            label: "Hromadné emaily",
            href: `/admin/rocniky/${id}/emaily/hromadne`,
        },
        { label: campaign.name },
    ];

    if (campaign.status === "DRAFT") {
        const [emailAccounts, availablePlaceholders] = await Promise.all([
            db.emailAccount.findMany({
                select: { id: true, email: true, label: true, isMain: true },
                orderBy: [{ isMain: "desc" }, { email: "asc" }],
            }),
            buildCampaignPlaceholders(id),
        ]);

        const filter = recipientFilterSchema.safeParse(
            campaign.recipientFilter,
        );

        return (
            <Container maxWidth="xl">
                <PageHeader breadcrumbs={breadcrumbs} title={campaign.name} />

                <CampaignForm
                    yearId={id}
                    emailAccounts={emailAccounts}
                    availablePlaceholders={availablePlaceholders}
                    campaign={{
                        id: campaign.id,
                        name: campaign.name,
                        subject: campaign.subject,
                        body: campaign.body,
                        bcc: campaign.bcc,
                        accountId: campaign.accountId,
                        recipientFilter: filter.success
                            ? filter.data
                            : { statuses: ["CONFIRMED"], paid: "all" },
                    }}
                />

                <CampaignDetailActions
                    campaignId={campaign.id}
                    yearId={id}
                    status={campaign.status}
                    stalled={false}
                    failedCount={0}
                    recipientFilter={
                        filter.success ? filter.data : undefined
                    }
                />
            </Container>
        );
    }

    const counts = await db.emailQueueItem.groupBy({
        by: ["status"],
        where: { campaignId: campaign.id },
        _count: { _all: true },
    });
    const countFor = (status: string) =>
        counts.find((c) => c.status === status)?._count._all ?? 0;

    const sentCount = countFor("sent");
    const failedCount = countFor("failed");
    const pendingCount = countFor("pending") + countFor("sending");

    const lockIdleSince = campaign.lockedAt ?? campaign.updatedAt;
    const stalled =
        campaign.status === "SENDING" &&
        pendingCount > 0 &&
        isLockIdleTooLong(lockIdleSince);

    const failedItems =
        failedCount > 0
            ? await db.emailQueueItem.findMany({
                  where: { campaignId: campaign.id, status: "failed" },
                  orderBy: { updatedAt: "desc" },
                  take: 50,
                  select: {
                      id: true,
                      recipient: true,
                      attempts: true,
                      lastError: true,
                  },
              })
            : [];

    const recipientItems = await db.emailQueueItem.findMany({
        where: { campaignId: campaign.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, recipient: true, status: true, sentAt: true },
    });

    const progress =
        campaign.totalCount > 0 ? (sentCount / campaign.totalCount) * 100 : 0;

    return (
        <Container maxWidth="lg">
            <PageHeader breadcrumbs={breadcrumbs} title={campaign.name} />

            {stalled && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                    Odesílání se zřejmě zastavilo. Pokračujte tlačítkem níže —
                    fronta se také automaticky obnoví při nočním zpracování.
                </Alert>
            )}

            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        <Chip
                            label={statusConfig.label}
                            color={statusConfig.color}
                        />
                        <Typography variant="body2" color="text.secondary">
                            Předmět: {campaign.subject}
                        </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Odesláno {sentCount} z {campaign.totalCount}
                        {failedCount > 0 && ` · neúspěšných: ${failedCount}`}
                        {pendingCount > 0 && ` · ve frontě: ${pendingCount}`}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 8, borderRadius: 1, mb: 2 }}
                    />

                    {campaign.startedAt && (
                        <Typography variant="body2" color="text.secondary">
                            Spuštěno:{" "}
                            {campaign.startedAt.toLocaleString("cs-CZ")}
                            {campaign.completedAt &&
                                ` · Dokončeno: ${campaign.completedAt.toLocaleString("cs-CZ")}`}
                        </Typography>
                    )}
                </CardContent>
            </Card>

            <Card variant="outlined" sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Text emailu
                    </Typography>
                    <Box
                        sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            p: 2,
                            maxHeight: 300,
                            overflowY: "auto",
                        }}
                        // Admin trust boundary: body is admin-authored Tiptap
                        // HTML and is exactly what gets emailed — no untrusted
                        // input reaches here.
                        dangerouslySetInnerHTML={{ __html: campaign.body }}
                    />
                </CardContent>
            </Card>

            <Box sx={{ mb: 3 }}>
                <MassEmailRecipientList
                    items={recipientItems.map((item) => ({
                        id: item.id,
                        recipient: item.recipient,
                        status: item.status,
                        sentAt: item.sentAt
                            ? item.sentAt.toLocaleString("cs-CZ")
                            : null,
                    }))}
                />
            </Box>

            <CampaignDetailActions
                campaignId={campaign.id}
                yearId={id}
                status={campaign.status}
                stalled={stalled}
                failedCount={failedCount}
            />

            {failedItems.length > 0 && (
                <Card variant="outlined" sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Neúspěšné emaily
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Příjemce</TableCell>
                                    <TableCell>Pokusů</TableCell>
                                    <TableCell>Chyba</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {failedItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.recipient}</TableCell>
                                        <TableCell>{item.attempts}</TableCell>
                                        <TableCell
                                            sx={{
                                                maxWidth: 400,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {item.lastError ?? "—"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {failedCount > failedItems.length && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Zobrazeno prvních {failedItems.length} z{" "}
                                {failedCount}.
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            )}
        </Container>
    );
}
