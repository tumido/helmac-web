"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Youtube from "@tiptap/extension-youtube";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { Details, DetailsSummary, DetailsContent } from "@tiptap/extension-details";
import {
    Box,
    IconButton,
    Divider,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
    Popover,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
} from "@mui/material";
import { getLinkTargets, type LinkTarget } from "@/lib/actions/link-targets";
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    StrikethroughS,
    FormatListBulleted,
    FormatListNumbered,
    FormatQuote,
    Code,
    Link as LinkIcon,
    LinkOff,
    Image as ImageIcon,
    Undo,
    Redo,
    Title,
    FormatColorText,
    FormatColorReset,
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
    FormatAlignJustify,
    Highlight as HighlightIcon,
    HorizontalRule,
    TableChart,
    OndemandVideo,
    UnfoldMore,
    SmartButton,
    Delete,
    Subject,
} from "@mui/icons-material";
import { Fragment } from "@tiptap/pm/model";
import { getHTMLFromFragment, Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import Paragraph from "@tiptap/extension-paragraph";
import Heading from "@tiptap/extension-heading";
import { defaultMarkdownSerializer } from "prosemirror-markdown";
import { Markdown, type MarkdownStorage } from "tiptap-markdown";
import { useCallback, useEffect, useMemo, useState, type MutableRefObject } from "react";
import {
    PlaceholderExtension,
    type PlaceholderOption,
} from "@/components/admin/extensions/placeholder-extension";

const COLOR_PALETTE = [
    { label: "Cervena", value: "#E53935" },
    { label: "Ruzova", value: "#D81B60" },
    { label: "Fialova", value: "#8E24AA" },
    { label: "Modra", value: "#1E88E5" },
    { label: "Tyrkysova", value: "#00ACC1" },
    { label: "Zelena", value: "#43A047" },
    { label: "Oranzova", value: "#FB8C00" },
    { label: "Hneda", value: "#6D4C41" },
    { label: "Cerna", value: "#212121" },
];

export type { Editor } from "@tiptap/react";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    format?: "markdown" | "html";
    placeholder?: string;
    minHeight?: number;
    editorRef?: MutableRefObject<Editor | null>;
    editable?: boolean;
    yearId?: string;
    /**
     * Placeholder definitions for the chip extension. The host reads this
     * prop live via `placeholderMap` (re-memoized on change), so updates
     * propagate to tokenization. The `PlaceholderExtension` itself is
     * registered unconditionally so adding placeholders at runtime is safe.
     */
    placeholders?: PlaceholderOption[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeAlignedNode(defaultSerialize: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (state: any, node: any, parent: any, index: number) {
        const align = node.attrs?.textAlign;
        if (align && align !== "left") {
            const html = getHTMLFromFragment(
                Fragment.from(node),
                node.type.schema
            );
            state.write(html);
            state.closeBlock(node);
        } else {
            defaultSerialize(state, node, parent, index);
        }
    };
}

const AlignedParagraph = Paragraph.extend({
    addStorage() {
        return {
            markdown: {
                serialize: serializeAlignedNode(
                    defaultMarkdownSerializer.nodes.paragraph
                ),
                parse: {},
            },
        };
    },
});

const AlignedHeading = Heading.extend({
    addStorage() {
        return {
            markdown: {
                serialize: serializeAlignedNode(
                    defaultMarkdownSerializer.nodes.heading
                ),
                parse: {},
            },
        };
    },
});

const DefinitionList = TiptapNode.create({
    name: "definitionList",
    group: "block",
    content: "(definitionTerm | definitionDescription)+",

    parseHTML() {
        return [{ tag: "dl" }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["dl", mergeAttributes(HTMLAttributes), 0];
    },

    addStorage() {
        return {
            markdown: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                serialize(state: any, node: any) {
                    const html = getHTMLFromFragment(
                        Fragment.from(node),
                        node.type.schema
                    );
                    state.write(html);
                    state.closeBlock(node);
                },
                parse: {},
            },
        };
    },

    addKeyboardShortcuts() {
        return {
            Enter: ({ editor: ed }) => {
                const { $from } = ed.state.selection;
                for (let d = $from.depth; d >= 1; d--) {
                    const node = $from.node(d);
                    const parentNode = d > 1 ? $from.node(d - 1) : null;
                    if (
                        parentNode?.type.name !== "definitionList"
                    ) {
                        continue;
                    }
                    if (node.type.name === "definitionTerm") {
                        return ed.commands.insertContentAt(
                            $from.after(d),
                            {
                                type: "definitionDescription",
                                content: [
                                    { type: "paragraph" },
                                ],
                            }
                        );
                    }
                    if (node.type.name === "definitionDescription") {
                        if (node.textContent === "") {
                            return false;
                        }
                        return ed.commands.insertContentAt(
                            $from.after(d),
                            {
                                type: "definitionTerm",
                                content: [
                                    { type: "paragraph" },
                                ],
                            }
                        );
                    }
                }
                return false;
            },
        };
    },
});

const DefinitionTerm = TiptapNode.create({
    name: "definitionTerm",
    content: "paragraph",
    defining: true,

    parseHTML() {
        return [{ tag: "dt" }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["dt", mergeAttributes(HTMLAttributes), 0];
    },
});

const DefinitionDescription = TiptapNode.create({
    name: "definitionDescription",
    content: "paragraph+",
    defining: true,

    parseHTML() {
        return [{ tag: "dd" }];
    },

    renderHTML({ HTMLAttributes }) {
        return ["dd", mergeAttributes(HTMLAttributes), 0];
    },
});

type ButtonVariant = "contained" | "outlined" | "text";

const ButtonNode = TiptapNode.create({
    name: "buttonNode",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            label: { default: "Tlačítko" },
            href: { default: "" },
            variant: { default: "contained" as ButtonVariant },
        };
    },

    parseHTML() {
        return [{ tag: "a[data-button]" }];
    },

    renderHTML({ HTMLAttributes }) {
        const { label, href, variant, ...rest } = HTMLAttributes;
        return [
            "a",
            mergeAttributes(rest, {
                "data-button": variant || "contained",
                href: href || "#",
                class: `editor-button editor-button--${variant || "contained"}`,
            }),
            label || "Tlačítko",
        ];
    },

    addStorage() {
        return {
            markdown: {
                serialize(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    state: any,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    node: any,
                ) {
                    const { label, href, variant } = node.attrs;
                    state.write(
                        `<a data-button="${variant || "contained"}" href="${href || "#"}" class="editor-button editor-button--${variant || "contained"}">${label || "Tlačítko"}</a>`
                    );
                    state.closeBlock(node);
                },
                parse: {},
            },
        };
    },

    addNodeView() {
        return ({ node, getPos, editor: ed }) => {
            const dom = document.createElement("div");
            dom.style.padding = "4px 0";

            const btn = document.createElement("a");
            btn.textContent = node.attrs.label || "Tlačítko";
            btn.href = node.attrs.href || "#";
            btn.setAttribute(
                "data-button",
                node.attrs.variant || "contained"
            );
            btn.className = `editor-button editor-button--${node.attrs.variant || "contained"}`;
            btn.style.cssText =
                "display:inline-block;padding:6px 16px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:500;cursor:pointer;";

            const v = node.attrs.variant || "contained";
            if (v === "contained") {
                btn.style.backgroundColor = "#1976d2";
                btn.style.color = "#fff";
                btn.style.border = "none";
            } else if (v === "outlined") {
                btn.style.backgroundColor = "transparent";
                btn.style.color = "#1976d2";
                btn.style.border = "1px solid #1976d2";
            } else {
                btn.style.backgroundColor = "transparent";
                btn.style.color = "#1976d2";
                btn.style.border = "none";
            }

            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const pos = typeof getPos === "function" ? getPos() : null;
                if (pos !== null && pos !== undefined) {
                    ed.commands.setNodeSelection(pos);
                }
            });

            dom.appendChild(btn);
            return { dom };
        };
    },
});

function normalizeLinkHref(url: string): string {
    const trimmed = url.trim();
    if (trimmed === "") return trimmed;
    if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("//")) return trimmed;
    if (trimmed.startsWith("/")) return trimmed;
    if (trimmed.startsWith("#")) return trimmed;
    return `https://${trimmed}`;
}

function MenuBar({
    editor,
    yearId,
}: {
    editor: Editor | null;
    yearId?: string;
}) {
    const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkText, setLinkText] = useState("");
    const [linkEditing, setLinkEditing] = useState(false);
    const [showLinkTextField, setShowLinkTextField] = useState(false);
    const [linkTargets, setLinkTargets] = useState<LinkTarget[] | null>(null);
    const [linkTargetsLoading, setLinkTargetsLoading] = useState(false);

    const [btnDialogOpen, setBtnDialogOpen] = useState(false);
    const [btnLabel, setBtnLabel] = useState("Tlačítko");
    const [btnHref, setBtnHref] = useState("");
    const [btnVariant, setBtnVariant] = useState<ButtonVariant>("contained");

    const [, forceRender] = useState(0);
    useEffect(() => {
        if (!editor) return;
        const handler = () => forceRender((n) => n + 1);
        editor.on("transaction", handler);
        return () => {
            editor.off("transaction", handler);
        };
    }, [editor]);

    const openLinkDialog = useCallback(() => {
        if (!editor) return;
        const previousUrl: string = editor.getAttributes("link").href ?? "";
        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;
        const isInLink = editor.isActive("link");

        setLinkUrl(previousUrl);
        setLinkText("");
        setLinkEditing(Boolean(previousUrl));
        setShowLinkTextField(!hasSelection && !isInLink);
        setLinkDialogOpen(true);

        if (linkTargets === null && !linkTargetsLoading) {
            setLinkTargetsLoading(true);
            getLinkTargets(yearId)
                .then((targets) => setLinkTargets(targets))
                .catch(() => setLinkTargets([]))
                .finally(() => setLinkTargetsLoading(false));
        }
    }, [editor, yearId, linkTargets, linkTargetsLoading]);

    const handleTargetSelect = useCallback(
        (target: LinkTarget | null) => {
            if (!target) return;
            setLinkUrl(target.url);
            if (showLinkTextField) {
                setLinkText(target.label);
            }
        },
        [showLinkTextField],
    );

    const closeLinkDialog = useCallback(() => {
        setLinkDialogOpen(false);
    }, []);

    const submitLink = useCallback(() => {
        if (!editor) return;

        const rawUrl = linkUrl.trim();
        if (rawUrl === "") {
            return;
        }

        const href = normalizeLinkHref(rawUrl);

        const { from, to } = editor.state.selection;
        const hasSelection = from !== to;

        if (hasSelection || editor.isActive("link")) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href })
                .run();
        } else {
            const text = linkText.trim() || rawUrl;
            editor
                .chain()
                .focus()
                .insertContent({
                    type: "text",
                    text,
                    marks: [{ type: "link", attrs: { href } }],
                })
                .run();
        }

        setLinkDialogOpen(false);
    }, [editor, linkUrl, linkText]);

    const removeLink = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        setLinkDialogOpen(false);
    }, [editor]);

    const addImage = useCallback(() => {
        if (!editor) return;

        const url = window.prompt("URL obrazku:");

        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const addYoutubeVideo = useCallback(() => {
        if (!editor) return;

        const url = window.prompt("YouTube URL:");

        if (url) {
            editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }
    }, [editor]);

    const openBtnDialog = useCallback(() => {
        if (!editor) return;
        const node = editor.state.selection.$from.parent;
        if (node.type.name === "buttonNode") {
            setBtnLabel(node.attrs.label || "");
            setBtnHref(node.attrs.href || "");
            setBtnVariant(node.attrs.variant || "contained");
        } else {
            setBtnLabel("Tlačítko");
            setBtnHref("");
            setBtnVariant("contained");
        }
        setBtnDialogOpen(true);
    }, [editor]);

    const submitBtn = useCallback(() => {
        if (!editor) return;
        editor
            .chain()
            .focus()
            .insertContent({
                type: "buttonNode",
                attrs: {
                    label: btnLabel,
                    href: normalizeLinkHref(btnHref),
                    variant: btnVariant,
                },
            })
            .run();
        setBtnDialogOpen(false);
    }, [editor, btnLabel, btnHref, btnVariant]);

    if (!editor) {
        return null;
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 0.5,
                p: 1,
                borderBottom: 1,
                borderColor: "divider",
                backgroundColor: "grey.50",
            }}
        >
            {/* Text formatting */}
            <Tooltip title="Tucne (Ctrl+B)">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    color={editor.isActive("bold") ? "primary" : "default"}
                >
                    <FormatBold fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Kurziva (Ctrl+I)">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    color={editor.isActive("italic") ? "primary" : "default"}
                >
                    <FormatItalic fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Podtrzene (Ctrl+U)">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    color={editor.isActive("underline") ? "primary" : "default"}
                >
                    <FormatUnderlined fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Preskrtnute">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    color={editor.isActive("strike") ? "primary" : "default"}
                >
                    <StrikethroughS fontSize="small" />
                </IconButton>
            </Tooltip>

            {/* Text color */}
            <Tooltip title="Barva textu">
                <IconButton
                    size="small"
                    onClick={(e) => setColorAnchor(e.currentTarget)}
                >
                    <FormatColorText
                        fontSize="small"
                        sx={{
                            color: editor.getAttributes("textStyle").color || "inherit",
                        }}
                    />
                </IconButton>
            </Tooltip>
            <Popover
                open={Boolean(colorAnchor)}
                anchorEl={colorAnchor}
                onClose={() => setColorAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, p: 1, maxWidth: 176 }}>
                    {COLOR_PALETTE.map((color) => (
                        <Tooltip key={color.value} title={color.label}>
                            <Box
                                component="button"
                                onClick={() => {
                                    editor.chain().focus().setColor(color.value).run();
                                    setColorAnchor(null);
                                }}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "4px",
                                    backgroundColor: color.value,
                                    border: "2px solid",
                                    borderColor: editor.getAttributes("textStyle").color === color.value
                                        ? "primary.main"
                                        : "transparent",
                                    cursor: "pointer",
                                    p: 0,
                                    "&:hover": { opacity: 0.8 },
                                }}
                            />
                        </Tooltip>
                    ))}
                    <Tooltip title="Odstranit barvu">
                        <IconButton
                            size="small"
                            onClick={() => {
                                editor.chain().focus().unsetColor().run();
                                setColorAnchor(null);
                            }}
                        >
                            <FormatColorReset fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Popover>

            <Tooltip title="Zvyrazneni">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    color={editor.isActive("highlight") ? "primary" : "default"}
                >
                    <HighlightIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Kod">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    color={editor.isActive("code") ? "primary" : "default"}
                >
                    <Code fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Headings */}
            <ToggleButtonGroup
                size="small"
                exclusive
                value={
                    editor.isActive("heading", { level: 2 })
                        ? "h2"
                        : editor.isActive("heading", { level: 3 })
                          ? "h3"
                          : null
                }
                sx={{ "& .MuiToggleButton-root": { px: 1, py: 0.5 } }}
            >
                <ToggleButton
                    value="h2"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                >
                    <Title fontSize="small" />
                    <Box component="span" sx={{ ml: 0.5, fontSize: "0.75rem" }}>
                        H2
                    </Box>
                </ToggleButton>
                <ToggleButton
                    value="h3"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                >
                    <Title fontSize="small" />
                    <Box component="span" sx={{ ml: 0.5, fontSize: "0.75rem" }}>
                        H3
                    </Box>
                </ToggleButton>
            </ToggleButtonGroup>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Text alignment */}
            <Tooltip title="Zarovnat vlevo">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    color={editor.isActive({ textAlign: "left" }) ? "primary" : "default"}
                >
                    <FormatAlignLeft fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Zarovnat na stred">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    color={editor.isActive({ textAlign: "center" }) ? "primary" : "default"}
                >
                    <FormatAlignCenter fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Zarovnat vpravo">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    color={editor.isActive({ textAlign: "right" }) ? "primary" : "default"}
                >
                    <FormatAlignRight fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Zarovnat do bloku">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setTextAlign("justify").run()}
                    color={editor.isActive({ textAlign: "justify" }) ? "primary" : "default"}
                >
                    <FormatAlignJustify fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Lists */}
            <Tooltip title="Odrazkovy seznam">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    color={editor.isActive("bulletList") ? "primary" : "default"}
                >
                    <FormatListBulleted fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Cislovany seznam">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    color={editor.isActive("orderedList") ? "primary" : "default"}
                >
                    <FormatListNumbered fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Citat">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    color={editor.isActive("blockquote") ? "primary" : "default"}
                >
                    <FormatQuote fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Vodorovny oddelovac">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                >
                    <HorizontalRule fontSize="small" />
                </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Links & Images */}
            <Tooltip title="Pridat odkaz">
                <IconButton
                    size="small"
                    onClick={openLinkDialog}
                    color={editor.isActive("link") ? "primary" : "default"}
                >
                    <LinkIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            {editor.isActive("link") && (
                <Tooltip title="Odebrat odkaz">
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().unsetLink().run()}
                    >
                        <LinkOff fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}

            <Tooltip title="Vlozit obrazek">
                <IconButton size="small" onClick={addImage}>
                    <ImageIcon fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Vlozit tabulku">
                <IconButton
                    size="small"
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                            .run()
                    }
                >
                    <TableChart fontSize="small" />
                </IconButton>
            </Tooltip>

            {editor.isActive("table") && (
                <>
                    <Tooltip title="Pridat sloupec za">
                        <IconButton
                            size="small"
                            onClick={() =>
                                editor.chain().focus().addColumnAfter().run()
                            }
                        >
                            <Box component="span" sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>
                                +C
                            </Box>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Smazat sloupec">
                        <IconButton
                            size="small"
                            onClick={() =>
                                editor.chain().focus().deleteColumn().run()
                            }
                        >
                            <Box component="span" sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>
                                −C
                            </Box>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Pridat radek pod">
                        <IconButton
                            size="small"
                            onClick={() =>
                                editor.chain().focus().addRowAfter().run()
                            }
                        >
                            <Box component="span" sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>
                                +R
                            </Box>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Smazat radek">
                        <IconButton
                            size="small"
                            onClick={() =>
                                editor.chain().focus().deleteRow().run()
                            }
                        >
                            <Box component="span" sx={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}>
                                −R
                            </Box>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Smazat tabulku">
                        <IconButton
                            size="small"
                            onClick={() =>
                                editor.chain().focus().deleteTable().run()
                            }
                            sx={{ color: "error.main" }}
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </>
            )}

            <Tooltip title="Vlozit YouTube video">
                <IconButton size="small" onClick={addYoutubeVideo}>
                    <OndemandVideo fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Rozbalovaci sekce">
                <IconButton
                    size="small"
                    onClick={() => editor.chain().focus().setDetails().run()}
                    color={editor.isActive("details") ? "primary" : "default"}
                >
                    <UnfoldMore fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Vlozit tlacitko">
                <IconButton size="small" onClick={openBtnDialog}>
                    <SmartButton fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Definiční seznam">
                <IconButton
                    size="small"
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .insertContent({
                                type: "definitionList",
                                content: [
                                    {
                                        type: "definitionTerm",
                                        content: [
                                            {
                                                type: "paragraph",
                                                content: [
                                                    {
                                                        type: "text",
                                                        text: "Pojem",
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: "definitionDescription",
                                        content: [
                                            {
                                                type: "paragraph",
                                                content: [
                                                    {
                                                        type: "text",
                                                        text: "Definice",
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            })
                            .run()
                    }
                    color={
                        editor.isActive("definitionList")
                            ? "primary"
                            : "default"
                    }
                >
                    <Subject fontSize="small" />
                </IconButton>
            </Tooltip>

            <Box sx={{ flex: 1 }} />

            {/* Undo/Redo */}
            <Tooltip title="Zpet (Ctrl+Z)">
                <span>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    >
                        <Undo fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>

            <Tooltip title="Znovu (Ctrl+Y)">
                <span>
                    <IconButton
                        size="small"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    >
                        <Redo fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>

            <Dialog
                open={linkDialogOpen}
                onClose={closeLinkDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    {linkEditing ? "Upravit odkaz" : "Pridat odkaz"}
                </DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="URL odkazu"
                        type="url"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                submitLink();
                            }
                        }}
                        placeholder="https://example.com"
                        fullWidth
                        variant="outlined"
                    />
                    {showLinkTextField && (
                        <TextField
                            margin="dense"
                            label="Text odkazu (volitelne)"
                            value={linkText}
                            onChange={(e) => setLinkText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    submitLink();
                                }
                            }}
                            placeholder="Pokud nevyplnite, zobrazi se URL"
                            fullWidth
                            variant="outlined"
                        />
                    )}
                    <Autocomplete<LinkTarget>
                        sx={{ mt: 2 }}
                        options={linkTargets ?? []}
                        loading={linkTargetsLoading}
                        groupBy={(option) => option.group}
                        getOptionLabel={(option) => option.label}
                        isOptionEqualToValue={(option, value) =>
                            option.url === value.url
                        }
                        value={null}
                        onChange={(_, value) => handleTargetSelect(value)}
                        blurOnSelect
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Vybrat stranku webu"
                                placeholder="Vyhledat stranku nebo podsekci"
                                variant="outlined"
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    {linkEditing && (
                        <Button onClick={removeLink} color="error">
                            Odebrat odkaz
                        </Button>
                    )}
                    <Box sx={{ flex: 1 }} />
                    <Button onClick={closeLinkDialog}>Zrusit</Button>
                    <Button
                        onClick={submitLink}
                        variant="contained"
                        disabled={linkUrl.trim() === ""}
                    >
                        {linkEditing ? "Ulozit" : "Pridat"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Button dialog */}
            <Dialog
                open={btnDialogOpen}
                onClose={() => setBtnDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Vložit tlačítko</DialogTitle>
                <DialogContent
                    sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}
                >
                    <TextField
                        autoFocus
                        label="Text tlačítka"
                        value={btnLabel}
                        onChange={(e) => setBtnLabel(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <TextField
                        label="Odkaz (URL)"
                        value={btnHref}
                        onChange={(e) => setBtnHref(e.target.value)}
                        fullWidth
                        size="small"
                    />
                    <ToggleButtonGroup
                        exclusive
                        value={btnVariant}
                        onChange={(_, v) => {
                            if (v) setBtnVariant(v);
                        }}
                        size="small"
                        fullWidth
                    >
                        <ToggleButton value="contained">Vyplněné</ToggleButton>
                        <ToggleButton value="outlined">Obrysové</ToggleButton>
                        <ToggleButton value="text">Textové</ToggleButton>
                    </ToggleButtonGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBtnDialogOpen(false)}>
                        Zrušit
                    </Button>
                    <Button
                        onClick={submitBtn}
                        variant="contained"
                        disabled={!btnLabel.trim()}
                    >
                        Vložit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export function RichTextEditor({
    value,
    onChange,
    format = "markdown",
    placeholder = "Zacnete psat...",
    minHeight = 300,
    editorRef,
    editable = true,
    yearId,
    placeholders,
}: RichTextEditorProps) {
    const isMarkdown = format === "markdown";

    const placeholderMap = useMemo(() => {
        const map = new Map<string, string>();
        for (const p of placeholders ?? []) {
            map.set(p.key, p.label);
        }
        return map;
    }, [placeholders]);

    const tokenizePlaceholders = useCallback(
        (ed: Editor) => {
            if (!placeholders || placeholders.length === 0) return;
            const placeholderType = ed.schema.nodes.placeholder;
            if (!placeholderType) return;

            const pattern = /\{([A-Za-z0-9_]+)\}/g;
            const replacements: {
                from: number;
                to: number;
                key: string;
                label: string;
            }[] = [];

            ed.state.doc.descendants((node, pos) => {
                // Skip code blocks entirely — `{firstName}` inside a fenced
                // block should be treated as code, not a token.
                if (node.type.name === "codeBlock") return false;

                if (!node.isText || !node.text) return;
                // Skip inline `code` mark for the same reason.
                if (node.marks.some((m) => m.type.name === "code")) return;

                // Tokens split across mark boundaries (e.g. `{first**Name**}`)
                // won't tokenize — text nodes split on each mark transition.
                // Acceptable edge case.
                let match: RegExpExecArray | null;
                pattern.lastIndex = 0;
                while ((match = pattern.exec(node.text)) !== null) {
                    const key = match[1];
                    const label = placeholderMap.get(key);
                    if (!label) continue;
                    const from = pos + match.index;
                    const to = from + match[0].length;
                    replacements.push({ from, to, key, label });
                }
            });

            if (replacements.length === 0) return;

            const tr = ed.state.tr;
            for (let i = replacements.length - 1; i >= 0; i--) {
                const { from, to, key, label } = replacements[i];
                tr.replaceWith(
                    from,
                    to,
                    placeholderType.create({ key, label }),
                );
            }
            ed.view.dispatch(
                tr.setMeta("addToHistory", false).setMeta("preventUpdate", true),
            );
        },
        [placeholders, placeholderMap],
    );

    const getContent = useCallback(
        (ed: Editor) => {
            if (!isMarkdown) return ed.getHTML();
            const md = ed.storage as unknown as {
                markdown: MarkdownStorage;
            };
            return md.markdown.getMarkdown();
        },
        [isMarkdown],
    );

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                paragraph: false,
                heading: false,
            }),
            AlignedParagraph,
            AlignedHeading.configure({
                levels: [2, 3],
            }),
            TextStyle,
            Color,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-link",
                    target: null,
                    rel: null,
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: "content-image",
                },
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Highlight,
            Typography,
            Youtube.configure({
                HTMLAttributes: {
                    class: "youtube-video",
                },
            }),
            Table.configure({
                resizable: false,
            }),
            TableRow,
            TableCell,
            TableHeader,
            Details,
            DetailsSummary,
            DetailsContent,
            ButtonNode,
            DefinitionList,
            DefinitionTerm,
            DefinitionDescription,
            ...(isMarkdown
                ? [
                      Markdown.configure({
                          html: true,
                          transformCopiedText: true,
                          transformPastedText: true,
                      }),
                  ]
                : []),
            PlaceholderExtension.configure({ placeholders: placeholders ?? [] }),
        ],
        content: value,
        editable,
        immediatelyRender: false,
        onCreate: ({ editor: ed }) => {
            tokenizePlaceholders(ed);
        },
        onUpdate: ({ editor: ed }) => {
            onChange(getContent(ed));
        },
        editorProps: {
            attributes: {
                class: "prose-editor",
            },
        },
    });

    // Sync editable prop changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(editable);
        }
    }, [editor, editable]);

    // Expose editor instance via ref
    useEffect(() => {
        if (editorRef) editorRef.current = editor;
    }, [editor, editorRef]);

    // Sync external value changes
    useEffect(() => {
        if (editor && value !== getContent(editor)) {
            editor.commands.setContent(value, { emitUpdate: false });
            tokenizePlaceholders(editor);
        }
    }, [editor, value, getContent, tokenizePlaceholders]);

    return (
        <Box
            sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
                ...(editable && {
                    height: "100%",
                    minHeight: 0,
                    display: "flex",
                    flexDirection: "column",
                    "&:focus-within": {
                        borderColor: "primary.main",
                        boxShadow: (theme) =>
                            `0 0 0 1px ${theme.palette.primary.main}`,
                    },
                }),
            }}
        >
            {editable && <MenuBar editor={editor} yearId={yearId} />}
            <Box
                sx={{
                    p: 2,
                    backgroundColor: "background.paper",
                    ...(editable
                        ? {
                              flex: 1,
                              minHeight,
                              overflowY: "auto",
                          }
                        : {
                              minHeight,
                          }),
                    "& .ProseMirror": {
                        outline: "none",
                        ...(editable
                            ? { height: "100%" }
                            : { minHeight: minHeight - 32 }),
                        "& p": {
                            margin: "0.5em 0",
                        },
                        "& h2": {
                            fontSize: "1.5rem",
                            fontWeight: 600,
                            margin: "1em 0 0.5em",
                        },
                        "& h3": {
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            margin: "1em 0 0.5em",
                        },
                        "& ul, & ol": {
                            paddingLeft: "1.5em",
                        },
                        "& ul": { listStyleType: "disc" },
                        "& ol": { listStyleType: "decimal" },
                        "& blockquote": {
                            borderLeft: "4px solid",
                            borderColor: "grey.300",
                            paddingLeft: "1em",
                            marginLeft: 0,
                            fontStyle: "italic",
                            color: "text.secondary",
                        },
                        "& code": {
                            backgroundColor: "grey.100",
                            borderRadius: "4px",
                            padding: "0.2em 0.4em",
                            fontFamily: "monospace",
                        },
                        "& a": {
                            color: "primary.main",
                            textDecoration: "underline",
                            ...(editable && {
                                pointerEvents: "none",
                            }),
                        },
                        "& img": {
                            maxWidth: "100%",
                            height: "auto",
                            borderRadius: "8px",
                            margin: "1em 0",
                        },
                        "& mark": {
                            backgroundColor: "#fef08a",
                            padding: "0.1em 0.25em",
                            borderRadius: "2px",
                        },
                        "& dl": {
                            display: "grid",
                            gridTemplateColumns: "auto 1fr",
                            gap: "4px",
                            columnGap: "24px",
                            margin: "0.5em 0",
                        },
                        "& dt": {
                            fontWeight: 600,
                            gridColumn: 1,
                        },
                        "& dd": {
                            margin: 0,
                            gridColumn: 2,
                            color: "text.secondary",
                        },
                        "& hr": {
                            border: "none",
                            borderTop: "2px solid",
                            borderColor: "grey.300",
                            margin: "1.5em 0",
                        },
                        "& table": {
                            borderCollapse: "collapse",
                            width: "100%",
                            margin: "1em 0",
                            "& td, & th": {
                                border: "1px solid",
                                borderColor: "grey.300",
                                padding: "0.5em",
                                minWidth: "50px",
                            },
                            "& th": {
                                backgroundColor: "grey.100",
                                fontWeight: 600,
                            },
                        },
                        "& [data-type='details']": {
                            border: "1px solid",
                            borderColor: "grey.300",
                            borderRadius: "4px",
                            padding: "0.5em",
                            margin: "1em 0",
                            "& > button": {
                                display: "none",
                            },
                        },
                        "& [data-type='detailsSummary']": {
                            fontWeight: 600,
                        },
                        "& [data-type='detailsContent'][hidden]": {
                            display: "block !important",
                        },
                        "& .youtube-video": {
                            "& iframe": {
                                maxWidth: "100%",
                                width: "100%",
                                aspectRatio: "16 / 9",
                                borderRadius: "8px",
                                margin: "1em 0",
                            },
                        },
                        "& .placeholder-chip": {
                            display: "inline-block",
                            backgroundColor: "primary.light",
                            color: "primary.contrastText",
                            padding: "0 0.45em",
                            borderRadius: "4px",
                            fontSize: "0.9em",
                            lineHeight: 1.4,
                            margin: "0 1px",
                            cursor: "default",
                            userSelect: "all",
                            whiteSpace: "nowrap",
                        },
                        "& p.is-editor-empty:first-child::before": {
                            content: `"${placeholder}"`,
                            color: "text.disabled",
                            float: "left",
                            height: 0,
                            pointerEvents: "none",
                        },
                    },
                }}
            >
                <EditorContent editor={editor} />
            </Box>
        </Box>
    );
}
