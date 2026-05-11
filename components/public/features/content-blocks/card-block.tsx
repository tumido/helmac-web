import {
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Typography,
} from "@mui/material";
import { MarkdownContent } from "@/components/ui/markdown-content";
import type { CardBlock } from "@/lib/types/content-blocks";

interface CardBlockRendererProps {
    block: CardBlock;
}

export function CardBlockRenderer({ block }: CardBlockRendererProps) {
    return (
        <Card
            variant="outlined"
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                borderRadius: 2,
                overflow: "hidden",
            }}
        >
            {block.imageUrl && (
                <CardMedia
                    component="img"
                    image={block.imageUrl}
                    alt={block.title}
                    sx={{ height: 260, objectFit: "cover" }}
                />
            )}
            <CardContent
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
                {block.buttonLabel && block.buttonUrl && (
                    <Box sx={{ pt: 1 }}>
                        <Button
                            variant="contained"
                            href={block.buttonUrl}
                            size="small"
                        >
                            {block.buttonLabel}
                        </Button>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
