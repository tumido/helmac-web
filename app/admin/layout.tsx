import { auth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/admin-layout";

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
        return <>{children}</>;
    }

    return (
        <AdminLayout
            userName={session.user.name || session.user.email || undefined}
            userRole={session.user.role}
        >
            {children}
        </AdminLayout>
    );
}
