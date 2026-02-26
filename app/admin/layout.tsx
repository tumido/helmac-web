import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { auth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminTheme } from "@/styles/theme";
import { getActiveYear } from "@/lib/services/years";

export default async function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [session, activeYear] = await Promise.all([auth(), getActiveYear()]);

    // Login page doesn't need the admin layout
    // The middleware handles the redirect for unauthenticated users

    // If no session and not on login page, the middleware will handle redirect
    if (!session?.user) {
        return (
            <ThemeProvider theme={adminTheme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={adminTheme}>
            <CssBaseline />
            <AdminLayout
                userName={session.user.name || session.user.email || undefined}
                userRole={session.user.role}
                activeYearId={activeYear?.id}
            >
                {children}
            </AdminLayout>
        </ThemeProvider>
    );
}
