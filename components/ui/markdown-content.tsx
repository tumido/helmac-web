"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { Box, Button, Typography } from "@mui/material";
import type { Components } from "react-markdown";
import { generateSlug } from "@/lib/utils/slugify";

const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [
        ...(defaultSchema.tagNames ?? []),
        "mark",
        "u",
        "details",
        "summary",
        "iframe",
        "dl",
        "dt",
        "dd",
    ],
    attributes: {
        ...defaultSchema.attributes,
        span: [...(defaultSchema.attributes?.span ?? []), "style"],
        p: [...(defaultSchema.attributes?.p ?? []), "style"],
        h2: [...(defaultSchema.attributes?.h2 ?? []), "style"],
        h3: [...(defaultSchema.attributes?.h3 ?? []), "style"],
        a: [
            ...(defaultSchema.attributes?.a ?? []),
            "data-button",
            "className",
            "class",
        ],
        iframe: ["src", "allowFullScreen", "allow", "frameBorder"],
    },
};

interface MarkdownContentProps {
    content: string;
    tocIds?: Map<string, string>;
}

export function MarkdownContent({
    content,
    tocIds,
}: MarkdownContentProps) {
    const components = useMemo<Components>(
        () => ({
            h2: ({ children, style }) => {
                const text =
                    typeof children === "string"
                        ? children
                        : extractText(children);
                const id =
                    tocIds?.get(text) ??
                    (generateSlug(text) || undefined);
                return (
                    <Typography
                        variant="h5"
                        component="h2"
                        id={id}
                        style={style}
                        sx={{
                            fontSize: "1.5rem",
                            fontWeight: 600,
                            mt: 3,
                            mb: 1,
                            scrollMarginTop: "80px",
                        }}
                    >
                        {children}
                    </Typography>
                );
            },
            h3: ({ children, style }) => {
                const text =
                    typeof children === "string"
                        ? children
                        : extractText(children);
                const id =
                    tocIds?.get(text) ??
                    (generateSlug(text) || undefined);
                return (
                    <Typography
                        variant="h6"
                        component="h3"
                        id={id}
                        style={style}
                        sx={{
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            mt: 2,
                            mb: 1,
                            scrollMarginTop: "80px",
                        }}
                    >
                        {children}
                    </Typography>
                );
            },
            p: ({ children, style }) => (
                <Typography
                    variant="body1"
                    component="p"
                    style={style}
                    sx={{ mb: 2 }}
                >
                    {children}
                </Typography>
            ),
            a: ({ children, href, node }) => {
                const dataButton = node?.properties?.dataButton as
                    | string
                    | undefined;
                if (dataButton) {
                    const variant = (
                        ["contained", "outlined", "text"] as const
                    ).includes(
                        dataButton as "contained" | "outlined" | "text"
                    )
                        ? (dataButton as
                              | "contained"
                              | "outlined"
                              | "text")
                        : "contained";
                    return (
                        <Button
                            variant={variant}
                            href={href}
                            size="small"
                            sx={{ my: 1 }}
                        >
                            {children}
                        </Button>
                    );
                }
                return (
                    <Box
                        component="a"
                        href={href}
                        sx={{
                            color: "primary.main",
                            textDecoration: "underline",
                        }}
                    >
                        {children}
                    </Box>
                );
            },
            img: ({ src, alt }) => (
                <Box
                    component="img"
                    src={src}
                    alt={alt ?? ""}
                    sx={{
                        maxWidth: "100%",
                        height: "auto",
                        borderRadius: 2,
                        my: 2,
                        display: "block",
                    }}
                />
            ),
            blockquote: ({ children }) => (
                <Box
                    component="blockquote"
                    sx={{
                        borderLeft: "4px solid",
                        borderColor: "divider",
                        pl: 2,
                        ml: 0,
                        fontStyle: "italic",
                        color: "text.secondary",
                    }}
                >
                    {children}
                </Box>
            ),
            table: ({ children }) => (
                <Box
                    component="table"
                    sx={{
                        borderCollapse: "collapse",
                        width: "100%",
                        my: 2,
                    }}
                >
                    {children}
                </Box>
            ),
            th: ({ children }) => (
                <Box
                    component="th"
                    sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        p: 1,
                        backgroundColor: "#4b4b4b",
                        color: "#fff",
                        fontWeight: 600,
                    }}
                >
                    {children}
                </Box>
            ),
            td: ({ children }) => (
                <Box
                    component="td"
                    sx={{
                        border: "1px solid",
                        borderColor: "divider",
                        p: 1,
                    }}
                >
                    {children}
                </Box>
            ),
            dl: ({ children }) => (
                <Box
                    component="dl"
                    sx={{
                        my: 2,
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: 0.5,
                        columnGap: 3,
                    }}
                >
                    {children}
                </Box>
            ),
            dt: ({ children }) => (
                <Box
                    component="dt"
                    sx={{
                        fontWeight: 600,
                        gridColumn: 1,
                    }}
                >
                    {children}
                </Box>
            ),
            dd: ({ children }) => (
                <Box
                    component="dd"
                    sx={{
                        m: 0,
                        gridColumn: 2,
                        color: "text.secondary",
                    }}
                >
                    {children}
                </Box>
            ),
            hr: () => (
                <Box
                    component="hr"
                    sx={{
                        border: "none",
                        borderTop: "2px solid",
                        borderColor: "divider",
                        my: 3,
                    }}
                />
            ),
            ul: ({ children }) => (
                <Box
                    component="ul"
                    sx={{
                        pl: 3,
                        mb: 2,
                        listStyleType: "disc",
                    }}
                >
                    {children}
                </Box>
            ),
            ol: ({ children }) => (
                <Box
                    component="ol"
                    sx={{
                        pl: 3,
                        mb: 2,
                        listStyleType: "decimal",
                    }}
                >
                    {children}
                </Box>
            ),
            mark: ({ children }) => (
                <Box
                    component="mark"
                    sx={{
                        backgroundColor: "#fef08a",
                        px: 0.25,
                        borderRadius: "2px",
                    }}
                >
                    {children}
                </Box>
            ),
            details: ({ children }) => (
                <Box
                    component="details"
                    sx={{
                        border: "0px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                        p: 1,
                        my: 2,
                    }}
                >
                    {children}
                </Box>
            ),
            summary: ({ children }) => (
                <Box
                    component="summary"
                    sx={{
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                >
                    {children}
                </Box>
            ),
            iframe: ({ src }) => (
                <Box
                    component="iframe"
                    src={src as string}
                    sx={{
                        maxWidth: "100%",
                        width: "100%",
                        aspectRatio: "16 / 9",
                        borderRadius: 1,
                        my: 2,
                        border: "none",
                    }}
                />
            ),
        }),
        [tocIds],
    );

    return (
        <Box
            sx={{
                overflowWrap: "break-word",
                wordBreak: "break-word",
                lineHeight: 1.8,
            }}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                    rehypeRaw,
                    [rehypeSanitize, sanitizeSchema],
                ]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </Box>
    );
}

function extractText(node: unknown): string {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (
        node &&
        typeof node === "object" &&
        "props" in node &&
        (node as { props?: { children?: unknown } }).props
    ) {
        return extractText(
            (node as { props: { children?: unknown } }).props
                .children,
        );
    }
    return "";
}
