import { Box, Button, CardMedia, Typography } from "@mui/material";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import { grainyMaskHorizontal } from "@/lib/utils/grainy-mask";
import { storageUrl } from "@/lib/utils/storage";
import type { CardBlock } from "@/lib/types/content-blocks";

interface CardBlockRendererProps {
    block: CardBlock;
}

export function CardBlockRenderer({ block }: CardBlockRendererProps) {
    return (
        <Box
            sx={{
                position: "relative",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                mx: 2,
                backgroundColor: "rgba(128, 128, 128, 0.08)",
                "&:hover img": { filter: "none" },
            }}
        >
            <OrnamentalUnderline
                sx={{
                    position: "absolute",
                    top: 0,
                    left: -1,
                    right: -1,
                    mt: 0,
                    mx: 0,
                    zIndex: 1,
                }}
            />
            {block.imageUrl && (
                <CardMedia
                    component="img"
                    image={storageUrl(block.imageUrl)}
                    alt={block.title}
                    sx={{
                        height: 140,
                        objectFit: "cover",
                        ...grainyMaskHorizontal,
                        filter: "grayscale(0.3) sepia(0.15) saturate(1.1) brightness(0.9)",
                        transition: "filter 0.4s ease",
                    }}
                />
            )}
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    p: 3,
                }}
            >
                {block.title && (
                    <Typography
                        variant="h5"
                        component="h3"
                        sx={{ fontWeight: 700 }}
                    >
                        {block.title}
                    </Typography>
                )}
                {block.text && (
                    <Box sx={{ flex: 1 }}>
                        <MarkdownContent content={block.text} />
                    </Box>
                )}
                {block.buttons.some((b) => b.label && b.href) && (
                    <Box
                        sx={{
                            pt: 1,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                        }}
                    >
                        {block.buttons.map(
                            (btn) =>
                                btn.label &&
                                btn.href && (
                                    <Button
                                        key={btn.id}
                                        variant={btn.variant}
                                        href={btn.href}
                                        size="small"
                                    >
                                        {btn.label}
                                    </Button>
                                )
                        )}
                    </Box>
                )}
            </Box>
            <OrnamentalUnderline
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: -1,
                    right: -1,
                    mt: 0,
                    mx: 0,
                    transform: "scaleY(-1)",
                }}
            />
        </Box>
    );
}
