import { ThemeWrapper } from "@/components/public/layout/ThemeWrapper";
import { getNavigationSubtabs, getRegistrationStatus } from "@/lib/services";
import { NavSubtabs } from "@/lib/services/navigation";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [navSubtabs, regStatus] = await Promise.all([
        getNavigationSubtabs(),
        getRegistrationStatus(),
    ]);

    return (
        <ThemeWrapper navSubtabs={navSubtabs as NavSubtabs} registrationOpen={regStatus.isOpen}>
            {children}
        </ThemeWrapper>
    );
}
