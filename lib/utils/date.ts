export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function formatDateRange(startDate: Date | null, endDate: Date | null): string | null {
    if (!startDate || !endDate) return null;
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    const sDay = String(sd.getDate()).padStart(2, "0");
    const sMonth = String(sd.getMonth() + 1).padStart(2, "0");
    const eDay = String(ed.getDate()).padStart(2, "0");
    const eMonth = String(ed.getMonth() + 1).padStart(2, "0");
    return `${sDay}.${sMonth}. – ${eDay}.${eMonth}.${ed.getFullYear()}`;
}
