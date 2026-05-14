export async function fetchOgImage(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000),
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; HelmacBot/1.0)",
            },
            redirect: "follow",
        });

        if (!response.ok) return null;

        const html = await response.text();

        const match = html.match(
            /<meta\s+[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*\/?>/i
        ) ?? html.match(
            /<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*\/?>/i
        );

        return match?.[1] || null;
    } catch {
        return null;
    }
}
