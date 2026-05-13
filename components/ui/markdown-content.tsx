"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { alpha, Box, Button, type Theme, Typography } from "@mui/material";
import type { Components } from "react-markdown";
import { generateSlug } from "@/lib/utils/slugify";
import { DecorativeDivider } from "@/components/public/ui/Divider";
import { OrnamentalUnderline } from "@/components/public/ui/OrnamentalUnderline";
import { grainyMaskBoth } from "@/lib/utils/grainy-mask";

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
        "div",
    ],
    attributes: {
        ...defaultSchema.attributes,
        span: [...(defaultSchema.attributes?.span ?? []), "style"],
        p: [...(defaultSchema.attributes?.p ?? []), "style"],
        h2: [...(defaultSchema.attributes?.h2 ?? []), "style"],
        h3: [...(defaultSchema.attributes?.h3 ?? []), "style"],
        a: [
            ...(defaultSchema.attributes?.a ?? []),
            "dataButton",
            "dataAlign",
            "className",
        ],
        div: [
            ...(defaultSchema.attributes?.div ?? []),
            "className",
            "dataAlign",
            "dataButton",
            "dataHref",
        ],
        iframe: ["src", "allowFullScreen", "allow", "frameBorder"],
    },
};

const ALIGN_MAP: Record<string, "flex-start" | "center" | "flex-end"> = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
};

function groupConsecutiveButtons(md: string): string {
    const btnRe =
        /^<(?:div|a)\s+data-button="[^"]*"(?:\s+data-align="([^"]*)")?(?:\s+data-href="[^"]*")?(?:\s+href="[^"]*")?(?:\s+class="[^"]*")?>[^<]*<\/(?:div|a)>\s*$/;
    const lines = md.split("\n");
    const result: string[] = [];
    let group: string[] = [];
    let groupAlign = "center";

    function flushGroup() {
        if (group.length === 0) return;
        result.push(`<div class="button-row" data-align="${groupAlign}">`);
        result.push(...group);
        result.push("</div>");
        group = [];
        groupAlign = "center";
    }

    for (const line of lines) {
        const match = btnRe.exec(line);
        if (match) {
            if (group.length === 0) {
                groupAlign = match[1] || "center";
            }
            group.push(line);
        } else if (line.trim() === "" && group.length > 0) {
            continue;
        } else {
            flushGroup();
            result.push(line);
        }
    }
    flushGroup();
    return result.join("\n");
}

interface MarkdownContentProps {
    content: string;
    tocIds?: Map<string, string>;
}

export function MarkdownContent({ content, tocIds }: MarkdownContentProps) {
    const processed = useMemo(
        () => groupConsecutiveButtons(content),
        [content]
    );

    const components = useMemo<Components>(
        () => ({
            h2: ({ children, style }) => {
                const text =
                    typeof children === "string"
                        ? children
                        : extractText(children);
                const id =
                    tocIds?.get(text) ?? (generateSlug(text) || undefined);
                return (
                    <Typography
                        variant="h5"
                        component="h2"
                        id={id}
                        style={style}
                        sx={{
                            fontFamily: '"Cinzel", serif',
                            fontSize: {
                                xs: "1.3rem",
                                sm: "1.5rem",
                            },
                            fontWeight: 700,
                            color: "primary.main",
                            textTransform: "uppercase",
                            letterSpacing: "0.02em",
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
                    tocIds?.get(text) ?? (generateSlug(text) || undefined);
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
                    ).includes(dataButton as "contained" | "outlined" | "text")
                        ? (dataButton as "contained" | "outlined" | "text")
                        : "contained";
                    return (
                        <Button
                            variant={variant}
                            href={href}
                            size="small"
                            sx={{ mx: 0.5, my: 0.5 }}
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
            div: ({ children, node }) => {
                const className = node?.properties?.className as
                    | string[]
                    | undefined;
                const dataButton = node?.properties?.dataButton as
                    | string
                    | undefined;
                if (className?.includes("button-row")) {
                    const align = (node?.properties?.dataAlign ||
                        "center") as string;
                    return (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: ALIGN_MAP[align] || "center",
                                flexWrap: "wrap",
                                gap: 1,
                                my: 1,
                            }}
                        >
                            {children}
                        </Box>
                    );
                }
                if (dataButton) {
                    const variant = (
                        ["contained", "outlined", "text"] as const
                    ).includes(dataButton as "contained" | "outlined" | "text")
                        ? (dataButton as "contained" | "outlined" | "text")
                        : "contained";
                    const href = node?.properties?.dataHref as
                        | string
                        | undefined;
                    return (
                        <Button
                            variant={variant}
                            href={href}
                            size="small"
                            sx={{ mx: 0.5, my: 0.5 }}
                        >
                            {children}
                        </Button>
                    );
                }
                return <div>{children}</div>;
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
                        ...grainyMaskBoth,
                        filter: "grayscale(0.3) sepia(0.15) saturate(1.1) brightness(0.9)",
                        transition: "filter 0.4s ease",
                        "&:hover": { filter: "none" },
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
                        "& tbody tr:not(:last-child)": {
                            borderBottom: "1px solid",
                            borderColor: "primary.main",
                        },
                        "& tbody td:first-of-type": {
                            whiteSpace: "nowrap",
                        },
                        "& td:not(:last-of-type), & th:not(:last-of-type)": {
                            borderRight: "1px solid",
                            borderColor: (theme: Theme) =>
                                alpha(theme.palette.primary.main, 0.25),
                        },
                    }}
                >
                    {children}
                </Box>
            ),
            thead: ({ children }) => (
                <Box component="thead">
                    {children}
                    <tr>
                        <td colSpan={100} style={{ padding: 0 }}>
                            <OrnamentalUnderline sx={{ mx: 0, mt: 0.5 }} />
                        </td>
                    </tr>
                </Box>
            ),
            th: ({ children }) => (
                <Box
                    component="th"
                    sx={{
                        p: 1,
                        color: "primary.main",
                        fontWeight: 700,
                        textAlign: "left",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                    }}
                >
                    {children}
                </Box>
            ),
            td: ({ children }) => (
                <Box
                    component="td"
                    sx={{
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
                        columnGap: 3,
                        "& p": { mb: 0 },
                        "& dt p": { fontWeight: "inherit" },
                    }}
                >
                    {children}
                </Box>
            ),
            dt: ({ children }) => (
                <Box
                    component="dt"
                    sx={{
                        fontWeight: 700,
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
            hr: () => <DecorativeDivider variant="simple" sx={{ my: 3 }} />,
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
        [tocIds]
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
                rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
                components={components}
            >
                {processed}
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
            (node as { props: { children?: unknown } }).props.children
        );
    }
    return "";
}
