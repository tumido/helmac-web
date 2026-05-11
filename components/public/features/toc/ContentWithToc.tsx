"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { Box } from "@mui/material";
import {
    extractMarkdownToc,
    buildTocIdMap,
} from "@/lib/utils/markdown-toc-helpers";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { BlockRenderer } from "@/components/public/features/content-blocks";
import { TableOfContents } from "./TableOfContents";
import type { ContentBlock } from "@/lib/types/content-blocks";
import { blocksToMarkdown } from "@/lib/types/content-blocks";

interface ContentWithTocProps {
    content: ContentBlock[] | string;
    showToc: boolean;
}

export function ContentWithToc({ content, showToc }: ContentWithTocProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const mobileTocRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(64);
    const [mobileTocHeight, setMobileTocHeight] = useState(0);
    const [mobileSticky, setMobileSticky] = useState(false);

    const isBlocks = Array.isArray(content);
    const markdownForToc = isBlocks ? blocksToMarkdown(content) : content;

    const { tocItems, tocIdMap } = useMemo(() => {
        if (!showToc) return { tocItems: [], tocIdMap: undefined };
        const items = extractMarkdownToc(markdownForToc);
        return { tocItems: items, tocIdMap: buildTocIdMap(items) };
    }, [markdownForToc, showToc]);

    const hasToc = showToc && tocItems.length >= 2;

    const getHeaderHeight = useCallback(() => {
        const header = document.querySelector("header");
        return header ? header.getBoundingClientRect().height : 64;
    }, []);

    const updatePosition = useCallback(() => {
        if (!contentRef.current) return;
        const rect = contentRef.current.getBoundingClientRect();
        const headerH = getHeaderHeight();
        setHeaderHeight(headerH);

        if (mobileTocRef.current) {
            const tocH = mobileTocRef.current.getBoundingClientRect().height;
            setMobileTocHeight(tocH);
        }
        setMobileSticky(rect.top < headerH);
    }, [getHeaderHeight]);

    useEffect(() => {
        if (!hasToc) return;

        requestAnimationFrame(updatePosition);
        window.addEventListener("scroll", updatePosition, { passive: true });
        window.addEventListener("resize", updatePosition, { passive: true });

        return () => {
            window.removeEventListener("scroll", updatePosition);
            window.removeEventListener("resize", updatePosition);
        };
    }, [hasToc, updatePosition]);

    if (!hasToc) {
        if (isBlocks) {
            return <BlockRenderer blocks={content} />;
        }
        return <MarkdownContent content={content} />;
    }

    return (
        <Box ref={contentRef}>
            {/* Mobile TOC: in-flow when not scrolled, fixed under header when scrolled */}
            <Box
                ref={mobileTocRef}
                sx={{
                    display: { xs: "block", lg: "none" },
                    ...(mobileSticky
                        ? {
                              position: "fixed",
                              top: headerHeight,
                              left: 0,
                              right: 0,
                              zIndex: 1099,
                          }
                        : {
                              position: "relative",
                          }),
                    backgroundColor: "background.default",
                    mb: mobileSticky ? 0 : 3,
                    transition: "opacity 0.2s ease",
                }}
            >
                <TableOfContents items={tocItems} variant="horizontal" />
            </Box>

            {/* Spacer to prevent content jump when mobile TOC becomes fixed */}
            {mobileSticky && (
                <Box
                    sx={{
                        display: { xs: "block", lg: "none" },
                        height: mobileTocHeight,
                    }}
                />
            )}

            {/* Desktop: flex layout with sticky sidebar */}
            <Box
                sx={{
                    display: { xs: "block", lg: "flex" },
                    gap: 4,
                    alignItems: "flex-start",
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {isBlocks ? (
                        <BlockRenderer blocks={content} tocIds={tocIdMap} />
                    ) : (
                        <MarkdownContent content={content} tocIds={tocIdMap} />
                    )}
                </Box>

                <Box
                    sx={{
                        display: { xs: "none", lg: "block" },
                        width: 200,
                        flexShrink: 0,
                        borderLeft: "1px solid",
                        borderColor: "divider",
                        pl: 3,
                        position: "sticky",
                        top: headerHeight + 16,
                        maxHeight: `calc(100vh - ${headerHeight + 32}px)`,
                        overflowY: "auto",
                        scrollbarWidth: "none",
                        "&::-webkit-scrollbar": { display: "none" },
                    }}
                >
                    <TableOfContents items={tocItems} variant="sidebar" />
                </Box>
            </Box>
        </Box>
    );
}
