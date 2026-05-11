import { Box, Typography } from "@mui/material";
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
                src={block.url}
                alt={block.alt}
                sx={{
                    maxWidth: "100%",
                    height: "auto",
                    borderRadius: 1,
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
