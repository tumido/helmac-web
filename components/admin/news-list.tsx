import {
    Card,
    Box,
    Typography,
    Divider,
    Tooltip,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { IconLinkButton } from "@/components/ui/link-button";
import { NewsActions } from "@/components/admin/news-actions";
import { formatDate } from "@/lib/utils/date";

interface News {
    id: string;
    slug: string;
    title: string;
    publishedAt: Date | null;
    year: {
        year: number;
        title: string;
    };
}

interface NewsListProps {
    news: News[];
    editBasePath?: string;
    showYear?: boolean;
}

export function NewsList({
    news,
    editBasePath = "/admin/novinky",
    showYear = true,
}: NewsListProps) {
    return (
        <Card>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1.5,
                    backgroundColor: "grey.50",
                    borderBottom: 1,
                    borderColor: "divider",
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Celkem {news.length} novinek
                </Typography>
            </Box>

            {news.map((item, index) => (
                <Box key={item.id}>
                    {index > 0 && <Divider />}
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 2,
                        }}
                    >
                        <Box sx={{ flex: 1 }}>
                            <Typography fontWeight="medium">
                                {item.title}
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mt: 0.5,
                                }}
                            >
                                {showYear && (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {item.year.year} - {item.year.title}
                                    </Typography>
                                )}
                                {item.publishedAt && (
                                    <>
                                        {showYear && (
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                |
                                            </Typography>
                                        )}
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            {formatDate(item.publishedAt)}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                            }}
                        >
                            <Tooltip title="Upravit novinku">
                                <IconLinkButton
                                    href={`${editBasePath}/${item.id}`}
                                    size="small"
                                >
                                    <Edit />
                                </IconLinkButton>
                            </Tooltip>
                            <NewsActions newsId={item.id} />
                        </Box>
                    </Box>
                </Box>
            ))}
        </Card>
    );
}
