import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import {
    PUBLIC_SESSION_COOKIE,
    verifyPublicJWTEdge,
} from "@/lib/public-auth.config";

const { auth: adminAuth } = NextAuth(authConfig);

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Admin routes — delegate to Auth.js
    if (pathname.startsWith("/admin")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (adminAuth as any)(request);
    }

    // Public auth routes — redirect to /ucet if already logged in
    if (pathname === "/prihlaseni" || pathname === "/vytvorit-ucet") {
        const token = request.cookies.get(PUBLIC_SESSION_COOKIE)?.value;
        if (token) {
            const payload = await verifyPublicJWTEdge(token);
            if (payload) {
                return NextResponse.redirect(new URL("/ucet", request.url));
            }
        }
        return NextResponse.next();
    }

    // Account area — require public session
    if (pathname.startsWith("/ucet")) {
        const token = request.cookies.get(PUBLIC_SESSION_COOKIE)?.value;
        if (!token) {
            return NextResponse.redirect(
                new URL("/prihlaseni", request.url),
            );
        }

        const payload = await verifyPublicJWTEdge(token);
        if (!payload) {
            // Invalid/expired token — clear cookie and redirect
            const response = NextResponse.redirect(
                new URL("/prihlaseni", request.url),
            );
            response.cookies.delete(PUBLIC_SESSION_COOKIE);
            return response;
        }

        // Redirect unverified users to verification page
        if (!payload.emailVerified) {
            return NextResponse.redirect(
                new URL("/overeni-emailu?pending=true", request.url),
            );
        }

        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/ucet/:path*", "/prihlaseni", "/vytvorit-ucet"],
};
