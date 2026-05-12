export function parseQuantities(val: unknown): Record<string, number> {
    try {
        const parsed = typeof val === "string" ? JSON.parse(val || "{}") : val;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as Record<string, number>;
        }
    } catch {
        /* empty */
    }
    return {};
}

export function parseSelected(val: unknown): string[] {
    try {
        const arr = JSON.parse(String(val ?? "[]"));
        return Array.isArray(arr)
            ? arr.filter((v): v is string => typeof v === "string")
            : [];
    } catch {
        return [];
    }
}
