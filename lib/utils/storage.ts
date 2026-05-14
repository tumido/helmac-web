const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? "";

export function storageUrl(path: string | null | undefined): string {
    if (!path) return "";
    if (path.startsWith("/") || path.startsWith("http") || path.startsWith("blob:")) {
        return path;
    }
    return `${STORAGE_BASE_URL}/${path}`;
}
