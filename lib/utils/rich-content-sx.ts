import type { SxProps, Theme } from "@mui/material";

/**
 * Shared sx styles for rendering HTML produced by the Tiptap rich-text editor.
 * Use with `dangerouslySetInnerHTML` on a Typography component="div".
 */
export const richContentSx: SxProps<Theme> = {
    "& p": { mb: 2 },
    "& h2": {
        fontSize: "1.5rem",
        fontWeight: 600,
        mt: 3,
        mb: 1,
        scrollMarginTop: "80px",
    },
    "& h3": {
        fontSize: "1.25rem",
        fontWeight: 600,
        mt: 2,
        mb: 1,
        scrollMarginTop: "80px",
    },
    "& ul, & ol": {
        pl: 3,
        mb: 2,
    },
    "& ul": { listStyleType: "disc" },
    "& ol": { listStyleType: "decimal" },
    "& blockquote": {
        borderLeft: "4px solid",
        borderColor: "divider",
        pl: 2,
        ml: 0,
        fontStyle: "italic",
        color: "text.secondary",
    },
    "& a": {
        color: "primary.main",
        textDecoration: "underline",
    },
    "& img": {
        maxWidth: "100%",
        height: "auto",
        borderRadius: 2,
        my: 2,
    },
    "& mark": {
        backgroundColor: "#fef08a",
        px: 0.25,
        borderRadius: "2px",
    },
    "& hr": {
        border: "none",
        borderTop: "2px solid",
        borderColor: "divider",
        my: 3,
    },
    "& table": {
        borderCollapse: "collapse",
        width: "100%",
        my: 2,
        "& td, & th": {
            border: "1px solid",
            borderColor: "divider",
            p: 1,
        },
        "& th": {
            backgroundColor: "#4b4b4b",
            color: "#fff",
            fontWeight: 600,
        },
    },
    "& details": {
        border: "0px solid",
        borderColor: "divider",
        borderRadius: 1,
        p: 1,
        my: 2,
    },
    "& summary": {
        cursor: "pointer",
        fontWeight: 600,
    },
    "& details > [data-type='detailsContent'], & details > *:not(summary)": {
        marginTop: 2,
        marginLeft: 2,
    },
    "& iframe": {
        maxWidth: "100%",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 1,
        my: 2,
    },
    overflowWrap: "break-word",
    wordBreak: "break-word",
    lineHeight: 1.8,
};
