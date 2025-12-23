import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { auth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/admin-layout";
import { adminTheme } from "@/styles/theme";

export default async function AdminRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

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
            >
                {children}
            </AdminLayout>
        </ThemeProvider>
    );
}
