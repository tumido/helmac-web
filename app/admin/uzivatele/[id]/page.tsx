import { Container, Typography, Box, Chip } from "@mui/material";
import { Shield, Person, SupervisorAccount } from "@mui/icons-material";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth, requireSuperAdmin } from "@/lib/auth";
import { UserForm } from "@/components/forms/user-form";
import { AdminBreadcrumbs } from "@/components/admin/breadcrumbs";

interface EditUserPageProps {
    params: Promise<{ id: string }>;
}

const roleIcons: Record<string, React.ReactNode> = {
    SUPER_ADMIN: <Shield />,
    ADMIN: <SupervisorAccount />,
    EDITOR: <Person />,
};

const roleColors: Record<string, "error" | "warning" | "info"> = {
    SUPER_ADMIN: "error",
    ADMIN: "warning",
    EDITOR: "info",
};

async function getUser(id: string) {
    return db.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
        },
    });
}

export default async function EditUserPage({ params }: EditUserPageProps) {
    // Check permissions
    try {
        await requireSuperAdmin();
    } catch {
        redirect("/admin");
    }

    const { id } = await params;
    const [user, session] = await Promise.all([getUser(id), auth()]);

    if (!user) {
        notFound();
    }

    const isCurrentUser = session?.user?.id === user.id;

    return (
        <Container maxWidth="md">
            <AdminBreadcrumbs
                items={[
                    { label: "Uzivatele", href: "/admin/uzivatele" },
                    { label: user.name },
                ]}
            />
            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        mb: 1,
                    }}
                >
                    <Typography variant="h4">Upravit uzivatele</Typography>
                    <Chip
                        label={user.role.replace("_", " ")}
                        color={roleColors[user.role]}
                        size="small"
                        icon={roleIcons[user.role] as React.ReactElement}
                    />
                    {isCurrentUser && (
                        <Chip label="Vas ucet" size="small" variant="outlined" />
                    )}
                </Box>
                <Typography color="text.secondary">{user.name}</Typography>
            </Box>

            <UserForm
                mode="edit"
                userId={user.id}
                defaultValues={{
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }}
            />
        </Container>
    );
}
