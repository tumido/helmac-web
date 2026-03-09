import { notFound } from "next/navigation";
import { getYearById } from "@/lib/services/years";
import { YearSidebarSetter } from "@/components/admin/year-sidebar-setter";

interface YearLayoutProps {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}

export default async function YearLayout({ children, params }: YearLayoutProps) {
    const { id } = await params;
    const year = await getYearById(id);

    if (!year) {
        notFound();
    }

    return (
        <YearSidebarSetter
            yearData={{
                id: year.id,
                year: year.year,
                title: year.title,
                startDate: year.startDate?.toISOString() ?? null,
                endDate: year.endDate?.toISOString() ?? null,
            }}
        >
            {children}
        </YearSidebarSetter>
    );
}
