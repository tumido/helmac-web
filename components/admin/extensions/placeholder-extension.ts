/**
 * Placeholder chip extension for Tiptap.
 *
 * Canonical persisted format: `<span data-placeholder data-key="..."
 * data-label="...">{key}</span>`. The wrapper element is required —
 * ProseMirror atom inline nodes must serialize via `toDOM` to an
 * Element (not a bare text node), or the editor view crashes on
 * decoration application (`dom.hasAttribute is not a function`).
 * The wrapper carries no `class`, so it inherits no editor styling
 * when sent in outgoing emails or rendered in the read-only preview.
 *
 * Editor view (nodeView): a `contenteditable=false` chip showing the
 * friendly `{label}`. The asymmetry — `{key}` inside the persisted
 * span, `{label}` in the live editor — is intentional: admins see
 * Czech labels while the persisted form stays machine-keyed so
 * `replacePlaceholders` (in `lib/utils/email.ts`) can substitute real
 * values at send time.
 *
 * Round-trip: the host editor (rich-text-editor.tsx) runs
 * `tokenizePlaceholders` after every `setContent` to convert plain
 * `{key}` text (e.g. from markdown content) back into placeholder
 * nodes. Existing wrapped spans are recovered via `parseHTML`.
 */

import { Node } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

export interface PlaceholderOption {
    key: string;
    label: string;
}

export interface PlaceholderExtensionOptions {
    placeholders: PlaceholderOption[];
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        placeholder: {
            insertPlaceholder: (attrs: {
                key: string;
                label: string;
            }) => ReturnType;
        };
    }
}

export const PlaceholderExtension = Node.create<PlaceholderExtensionOptions>({
    name: "placeholder",
    inline: true,
    group: "inline",
    atom: true,
    selectable: true,
    draggable: false,

    addOptions() {
        return {
            placeholders: [],
        };
    },

    addAttributes() {
        return {
            key: {
                default: "",
                parseHTML: (el) => el.getAttribute("data-key") ?? "",
                renderHTML: (attrs) => ({ "data-key": attrs.key }),
            },
            label: {
                default: "",
                parseHTML: (el) => el.getAttribute("data-label") ?? "",
                renderHTML: (attrs) => ({ "data-label": attrs.label }),
            },
        };
    },

    parseHTML() {
        return [{ tag: "span[data-placeholder]" }];
    },

    renderHTML({ node, HTMLAttributes }) {
        const key = String(node.attrs.key ?? "");
        return [
            "span",
            { ...HTMLAttributes, "data-placeholder": "" },
            `{${key}}`,
        ];
    },

    addNodeView() {
        return ({ node }) => {
            const dom = document.createElement("span");
            const key = String(node.attrs.key ?? "");
            const label = String(node.attrs.label ?? key);
            dom.setAttribute("data-placeholder", "");
            dom.setAttribute("data-key", key);
            dom.setAttribute("data-label", label);
            dom.setAttribute("spellcheck", "false");
            dom.className = "placeholder-chip";
            dom.contentEditable = "false";
            dom.textContent = `{${label}}`;
            return { dom };
        };
    },

    addCommands() {
        return {
            insertPlaceholder:
                (attrs) =>
                ({ chain }) => {
                    return chain()
                        .focus()
                        .insertContent({
                            type: this.name,
                            attrs,
                        })
                        .run();
                },
        };
    },

    addStorage() {
        return {
            markdown: {
                serialize(
                    state: { write: (text: string) => void },
                    node: ProseMirrorNode,
                ) {
                    state.write(`{${String(node.attrs.key ?? "")}}`);
                },
                parse: {
                    setup() {
                        // No-op. tiptap-markdown@^0.9 has no typed API for
                        // registering a parser hook for our `{key}` syntax.
                        // Instead, the host editor runs `tokenizePlaceholders`
                        // after each `setContent` to convert plain-text
                        // tokens into placeholder nodes.
                        // TODO: revisit if tiptap-markdown adds a typed parser
                        // registration API in a future major.
                    },
                },
            },
        };
    },
});
