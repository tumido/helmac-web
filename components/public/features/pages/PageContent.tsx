import { Box, Typography } from "@mui/material";

interface PageContentProps {
    content: unknown;
}

interface ContentBlock {
    type: "paragraph" | "heading" | "list";
    text?: string;
    level?: number;
    items?: string[];
}

function isContentArray(content: unknown): content is ContentBlock[] {
    return (
        Array.isArray(content) &&
        content.every(
            (item) =>
                typeof item === "object" &&
                item !== null &&
                "type" in item
        )
    );
}

function isContentObject(
    content: unknown
): content is { blocks: ContentBlock[] } {
    return (
        typeof content === "object" &&
        content !== null &&
        "blocks" in content &&
        Array.isArray((content as { blocks: unknown }).blocks)
    );
}

export function PageContent({ content }: PageContentProps) {
    let blocks: ContentBlock[] = [];

    if (isContentArray(content)) {
        blocks = content;
    } else if (isContentObject(content)) {
        blocks = content.blocks;
    } else if (typeof content === "string") {
        return (
            <Typography variant="body1" component="div">
                {content}
            </Typography>
        );
    }

    if (blocks.length === 0) {
        return (
            <Typography color="text.secondary">
                Obsah stránky zatím není k dispozici.
            </Typography>
        );
    }

    return (
        <Box sx={{ "& > *:not(:last-child)": { mb: 3 } }}>
            {blocks.map((block, index) => {
                switch (block.type) {
                    case "heading":
                        const HeadingVariant = `h${Math.min(
                            block.level || 2,
                            6
                        )}` as "h2" | "h3" | "h4" | "h5" | "h6";
                        return (
                            <Typography
                                key={index}
                                variant={HeadingVariant}
                                component={HeadingVariant}
                            >
                                {block.text}
                            </Typography>
                        );
                    case "paragraph":
                        return (
                            <Typography key={index} variant="body1">
                                {block.text}
                            </Typography>
                        );
                    case "list":
                        return (
                            <Box
                                key={index}
                                component="ul"
                                sx={{
                                    pl: 3,
                                    "& li": {
                                        mb: 1,
                                    },
                                }}
                            >
                                {block.items?.map((item, itemIndex) => (
                                    <Typography
                                        key={itemIndex}
                                        component="li"
                                        variant="body1"
                                    >
                                        {item}
                                    </Typography>
                                ))}
                            </Box>
                        );
                    default:
                        return null;
                }
            })}
        </Box>
    );
}
