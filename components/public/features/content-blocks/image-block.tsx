import { Box, Typography } from "@mui/material";
import { grainyMaskBoth } from "@/lib/utils/grainy-mask";
import { storageUrl } from "@/lib/utils/storage";
import type { ImageBlock } from "@/lib/types/content-blocks";

interface ImageBlockRendererProps {
    block: ImageBlock;
}

export function ImageBlockRenderer({ block }: ImageBlockRendererProps) {
    if (!block.url) return null;

    return (
        <Box sx={{ my: 2, textAlign: "center" }}>
            <Box
                component="img"
                src={storageUrl(block.url)}
                alt={block.alt}
                sx={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: 1,
                    ...grainyMaskBoth,
                    filter: "grayscale(0.3) sepia(0.15) saturate(1.1) brightness(0.9)",
                    transition: "filter 0.4s ease",
                    "&:hover": { filter: "none" },
                }}
            />
            {block.caption && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 1, display: "block" }}
                >
                    {block.caption}
                </Typography>
            )}
        </Box>
    );
}
