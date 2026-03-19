import { ThemeWrapper } from "@/components/public/layout/ThemeWrapper";
import { getNavigationSubtabs, getRegistrationStatus } from "@/lib/services";
import { NavSubtabs } from "@/lib/services/navigation";
import { getPublicSession } from "@/lib/public-auth";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [navSubtabs, regStatus, publicSession] = await Promise.all([
        getNavigationSubtabs(),
        getRegistrationStatus(),
        getPublicSession(),
    ]);

    const publicUser = publicSession
        ? { email: publicSession.email }
        : null;

    return (
        <ThemeWrapper
            navSubtabs={navSubtabs as NavSubtabs}
            registrationOpen={regStatus.isOpen}
            publicUser={publicUser}
        >
            {children}
        </ThemeWrapper>
    );
}
