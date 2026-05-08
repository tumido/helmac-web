/**
 * Transforms `<span data-placeholder>{key}</span>` spans (as persisted by
 * PlaceholderExtension.renderHTML) into chips that show `{label}` and carry
 * the `placeholder-chip` class — mirroring how the Tiptap editor's nodeView
 * renders them. Used by the read-only email template preview so it visually
 * matches edit mode.
 */
export function renderPlaceholderChipsInHtml(html: string): string {
    if (!html) return html;
    return html.replace(
        /<span\b([^>]*?\bdata-placeholder\b[^>]*?)>[^<]*<\/span>/gi,
        (_match, attrs: string) => {
            const labelMatch = attrs.match(/\bdata-label\s*=\s*"([^"]*)"/i);
            const keyMatch = attrs.match(/\bdata-key\s*=\s*"([^"]*)"/i);
            const label = (labelMatch?.[1] ?? keyMatch?.[1] ?? "").trim();

            const classMatch = attrs.match(/\bclass\s*=\s*"([^"]*)"/i);
            const newAttrs = classMatch
                ? classMatch[1].includes("placeholder-chip")
                    ? attrs
                    : attrs.replace(
                          /\bclass\s*=\s*"([^"]*)"/i,
                          'class="$1 placeholder-chip"',
                      )
                : attrs + ' class="placeholder-chip"';

            return `<span${newAttrs}>{${label}}</span>`;
        },
    );
}
