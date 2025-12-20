import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import argon2 from "argon2";
import { authConfig } from "./auth.config";
import { db } from "./db";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Heslo", type: "password" },
            },
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const user = await db.user.findUnique({
                    where: { email: parsed.data.email },
                });

                if (!user) return null;

                const passwordValid = await argon2.verify(
                    user.passwordHash,
                    parsed.data.password
                );

                if (!passwordValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
});

// Helper to get session in Server Components
export async function getSession() {
    return await auth();
}

// Helper to verify admin access
export async function requireAuth(allowedRoles?: string[]) {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Neprihlaseny");
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
        throw new Error("Nedostatecna opravneni");
    }

    return session;
}

// Role-specific checks
export async function requireSuperAdmin() {
    return requireAuth(["SUPER_ADMIN"]);
}

export async function requireAdmin() {
    return requireAuth(["SUPER_ADMIN", "ADMIN"]);
}

export async function requireEditor() {
    return requireAuth(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
}
