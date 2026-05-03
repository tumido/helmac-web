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
} from "@mui/material";
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
} from "@mui/icons-material";
import { useCallback, useEffect, useState, type MutableRefObject } from "react";

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
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
    editorRef?: MutableRefObject<Editor | null>;
    editable?: boolean;
}

function MenuBar({ editor }: { editor: Editor | null }) {
    const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);

    const setLink = useCallback(() => {
        if (!editor) return;

        const previousUrl = editor.getAttributes("link").href;
        const url = window.prompt("URL odkazu:", previousUrl);

        if (url === null) {
            return;
        }

        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
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
                    onClick={setLink}
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
        </Box>
    );
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = "Zacnete psat...",
    minHeight = 300,
    editorRef,
    editable = true,
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3],
                },
            }),
            TextStyle,
            Color,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-link",
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
        ],
        content: value,
        editable,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
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
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value, { emitUpdate: false });
        }
    }, [editor, value]);

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
            {editable && <MenuBar editor={editor} />}
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
