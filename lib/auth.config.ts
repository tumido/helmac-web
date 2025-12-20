import type { NextAuthConfig } from "next-auth";

// This config is used by middleware (Edge runtime)
// It should NOT contain any Node.js-specific code
export const authConfig: NextAuthConfig = {
    pages: {
        signIn: "/admin/login",
    },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnAdmin = nextUrl.pathname.startsWith("/admin");
            const isOnLogin = nextUrl.pathname === "/admin/login";

            if (isOnAdmin && !isOnLogin) {
                return isLoggedIn;
            }

            if (isOnLogin && isLoggedIn) {
                return Response.redirect(new URL("/admin", nextUrl));
            }

            return true;
        },
    },
    providers: [], // Providers are added in auth.ts
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
};
