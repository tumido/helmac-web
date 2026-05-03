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

const CZECH_MONTHS_GENITIVE = [
    "ledna",
    "února",
    "března",
    "dubna",
    "května",
    "června",
    "července",
    "srpna",
    "září",
    "října",
    "listopadu",
    "prosince",
];

export function formatEventDateRange(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined,
): string | null {
    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;
    if (s && isNaN(s.getTime())) return null;
    if (e && isNaN(e.getTime())) return null;
    if (!s && !e) return null;

    const fmtSingle = (d: Date) =>
        `${d.getDate()}. ${CZECH_MONTHS_GENITIVE[d.getMonth()]} ${d.getFullYear()}`;

    if (s && !e) return fmtSingle(s);
    if (!s && e) return fmtSingle(e);

    const sameMonth =
        s!.getMonth() === e!.getMonth() && s!.getFullYear() === e!.getFullYear();
    const sameYear = s!.getFullYear() === e!.getFullYear();

    if (sameMonth) {
        return `${s!.getDate()}. – ${e!.getDate()}. ${CZECH_MONTHS_GENITIVE[e!.getMonth()]} ${e!.getFullYear()}`;
    }
    if (sameYear) {
        return `${s!.getDate()}. ${CZECH_MONTHS_GENITIVE[s!.getMonth()]} – ${e!.getDate()}. ${CZECH_MONTHS_GENITIVE[e!.getMonth()]} ${e!.getFullYear()}`;
    }
    return `${fmtSingle(s!)} – ${fmtSingle(e!)}`;
}
