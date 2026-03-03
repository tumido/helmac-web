import { ThemeWrapper } from "@/components/public/layout/ThemeWrapper";
import { getNavigationSubtabs } from "@/lib/services";
import { NavSubtabs } from "@/lib/services/navigation";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const navSubtabs: NavSubtabs = await getNavigationSubtabs();

    return <ThemeWrapper navSubtabs={navSubtabs}>{children}</ThemeWrapper>;
}
