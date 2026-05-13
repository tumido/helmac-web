import { Box, Button, Typography } from "@mui/material";
import { GameIcon } from "@/lib/icons";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { NewsItem } from "./news.types";
import { formatDate } from "@/lib/utils/date";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";

interface NewsFeedItemProps {
    news: NewsItem;
    isFeatured?: boolean;
    truncate?: boolean;
}

function normalizeDashes(s: string): string {
    return s.replace(/[‐-―−﹘﹣－]/g, "-");
}

function stripLeadingTitle(content: string, title: string): string {
    const normalized = normalizeDashes(
        title.toLowerCase().replace(/\s+/g, " ").trim()
    );
    const lines = content.split("\n");
    const first = normalizeDashes(
        (lines[0] ?? "")
            .replace(/^#+\s*/, "")
            .replace(/\*\*/g, "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim()
    );
    if (first === normalized) {
        return lines.slice(1).join("\n").replace(/^\n+/, "");
    }
    return content;
}

export function NewsFeedItem({
    news,
    isFeatured = false,
    truncate = false,
}: NewsFeedItemProps) {
    const formattedDate = news.publishedAt
        ? formatDate(news.publishedAt)
        : null;
    const content = stripLeadingTitle(news.content, news.title);
    const buttons = Array.isArray(news.actionButtons) ? news.actionButtons : [];

    return (
        <Box
            id={news.slug}
            sx={{
                position: "relative",
                backgroundColor: isFeatured
                    ? "rgba(201, 162, 39, 0.04)"
                    : "transparent",
                border: isFeatured ? "1px solid" : "none",
                borderColor: "rgba(201, 162, 39, 0.15)",
                borderRadius: 2,
                p: isFeatured ? { xs: 3, md: 4 } : { xs: 1, md: 1.5 },
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                <GameIcon
                    name="scroll-quill"
                    sx={{
                        color: "primary.main",
                        fontSize: isFeatured ? "2.2rem" : "1.8rem",
                    }}
                />
                <Typography
                    variant="h5"
                    component="h2"
                    sx={{
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 700,
                        fontSize: isFeatured
                            ? {
                                  xs: "1.4rem",
                                  sm: "1.7rem",
                              }
                            : {
                                  xs: "1.2rem",
                                  sm: "1.4rem",
                              },
                        color: "primary.main",
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        lineHeight: 1.3,
                    }}
                >
                    {news.title}
                </Typography>
            </Box>

            {isFeatured && (
                <Box sx={{ ml: "14px", mt: -0.5 }}>
                    <OrnamentalUnderline />
                </Box>
            )}

            <Box
                sx={{
                    pl: "22px",
                    ml: "15px",
                }}
            >
                {formattedDate && (
                    <Typography
                        variant="caption"
                        sx={{
                            color: "text.primary",
                            letterSpacing: "0.05em",
                            display: "block",
                            mb: 2,
                        }}
                    >
                        {formattedDate}
                    </Typography>
                )}

                {truncate ? (
                    <Box
                        sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        <MarkdownContent content={content} />
                    </Box>
                ) : (
                    <MarkdownContent content={content} />
                )}

                {truncate && (
                    <Typography
                        component="a"
                        href={`/novinky#${news.slug}`}
                        variant="caption"
                        sx={{
                            color: "primary.main",
                            textDecoration: "none",
                            display: "inline-block",
                            mt: 1,
                            letterSpacing: "0.05em",
                            fontFamily: '"Cinzel", serif',
                            fontWeight: 600,
                            "&:hover": {
                                textDecoration: "underline",
                            },
                        }}
                    >
                        Číst dále
                    </Typography>
                )}

                {buttons.length > 0 && (
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            mt: 2,
                        }}
                    >
                        {buttons.map((btn) => (
                            <Button
                                key={btn.url}
                                href={btn.url}
                                variant={btn.variant ?? "contained"}
                                size="small"
                            >
                                {btn.label}
                            </Button>
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
