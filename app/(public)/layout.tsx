import { cookies } from "next/headers";
import { ThemeWrapper } from "@/components/public/layout/ThemeWrapper";
import { getRegistrationStatus } from "@/lib/services";
import { getActiveYear } from "@/lib/services/years";
import { getNavigationData } from "@/lib/services/navigation";
import { getPublicSession } from "@/lib/public-auth";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [
        navigationData,
        regStatus,
        publicSession,
        cookieStore,
        activeYear,
    ] = await Promise.all([
        getNavigationData(),
        getRegistrationStatus(),
        getPublicSession(),
        cookies(),
        getActiveYear(),
    ]);

    const themeCookie =
        cookieStore.get("theme-mode")?.value;
    const initialTheme =
        themeCookie === "light" ? "light" : "dark";

    const publicUser = publicSession
        ? { email: publicSession.email }
        : null;

    const footerDates = activeYear
        ? {
              startDate:
                  activeYear.startDate?.toISOString() ??
                  null,
              endDate:
                  activeYear.endDate?.toISOString() ??
                  null,
          }
        : null;

    return (
        <ThemeWrapper
            navigationData={navigationData}
            registrationOpen={regStatus.isOpen}
            publicUser={publicUser}
            initialTheme={initialTheme}
            footerDates={footerDates}
        >
            {children}
        </ThemeWrapper>
    );
}
