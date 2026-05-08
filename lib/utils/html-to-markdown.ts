import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const PRESERVE_TAGS = [
    "mark",
    "u",
    "details",
    "summary",
    "iframe",
];

const PRESERVE_STYLE_TAGS = ["span", "p"];

export function htmlToMarkdown(html: string): string {
    const td = new TurndownService({
        headingStyle: "atx",
        bulletListMarker: "-",
        codeBlockStyle: "fenced",
    });

    td.use(gfm);

    for (const tag of PRESERVE_TAGS) {
        td.addRule(`preserve-${tag}`, {
            filter: tag as TurndownService.TagName,
            replacement: (_content, node) => {
                const el = node as HTMLElement;
                el.removeAttribute("data-type");
                return el.outerHTML;
            },
        });
    }

    for (const tag of PRESERVE_STYLE_TAGS) {
        td.addRule(`preserve-styled-${tag}`, {
            filter: (node) =>
                node.nodeName.toLowerCase() === tag &&
                !!node.getAttribute("style"),
            replacement: (_content, node) => {
                const el = node as HTMLElement;
                return el.outerHTML;
            },
        });
    }

    td.addRule("strip-tiptap-data-attrs", {
        filter: (node) => {
            const attrs = node.attributes;
            if (!attrs) return false;
            for (let i = 0; i < attrs.length; i++) {
                if (attrs[i].name.startsWith("data-")) return true;
            }
            return false;
        },
        replacement: (content, node) => {
            const el = node as HTMLElement;
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith("data-")) {
                    el.removeAttribute(attr.name);
                }
            }
            return content;
        },
    });

    return td.turndown(html).trim();
}
