/**
 * Transforms placeholder tokens into chip-styled spans for the read-only
 * email-template preview, so it visually matches the live editor (which
 * runs `tokenizePlaceholders` on every `setContent` to swap `{key}` text
 * for placeholder nodes).
 *
 * Two cases handled:
 *   1. Existing wrapped spans `<span data-placeholder data-key data-label>{key}</span>`
 *      (as persisted by `PlaceholderExtension.renderHTML`) — get the
 *      `placeholder-chip` class added and their inner text swapped to the
 *      friendly `{label}`.
 *   2. Plain `{key}` text — tokenized to wrapped chip spans when the key is
 *      in the supplied `placeholders` map. Skipped inside `<code>`/`<pre>`
 *      blocks and inside already-converted chip spans, mirroring the editor.
 */

interface PlaceholderOption {
    key: string;
    label: string;
}

export function renderPlaceholderChipsInHtml(
    html: string,
    placeholders?: PlaceholderOption[],
): string {
    if (!html) return html;

    let result = html.replace(
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

    if (placeholders && placeholders.length > 0) {
        const labelMap = new Map(placeholders.map((p) => [p.key, p.label]));
        result = tokenizePlainPlaceholders(result, labelMap);
    }

    return result;
}

function tokenizePlainPlaceholders(
    html: string,
    labelMap: Map<string, string>,
): string {
    const opaquePattern =
        /<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>|<span\b[^>]*?\bclass\s*=\s*"[^"]*\bplaceholder-chip\b[^"]*"[^>]*>[^<]*<\/span>/gi;

    const out: string[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = opaquePattern.exec(html)) !== null) {
        out.push(replaceTokens(html.slice(lastIndex, match.index), labelMap));
        out.push(match[0]);
        lastIndex = opaquePattern.lastIndex;
    }
    out.push(replaceTokens(html.slice(lastIndex), labelMap));

    return out.join("");
}

function replaceTokens(text: string, labelMap: Map<string, string>): string {
    return text.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key: string) => {
        const label = labelMap.get(key);
        if (!label) return match;
        return `<span class="placeholder-chip" data-placeholder="" data-key="${escapeAttr(key)}" data-label="${escapeAttr(label)}">{${escapeText(label)}}</span>`;
    });
}

function escapeAttr(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeText(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
